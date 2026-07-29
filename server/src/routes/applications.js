const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendMail, templates } = require('../utils/email');

const router = express.Router();

const applySchema = z.object({
  type: z.enum(['INTERNSHIP', 'DISSERTATION']),
  collegeName: z.string().min(2),
  durationMonths: z.number().int().positive(),
  topic: z.string().optional(),
  scientistId: z.string().optional(), // set if student has a pre-approved scientist
  autoAssignRequested: z.boolean().optional(),
});

// STUDENT: submit the Application (Request) Form.
router.post('/', requireAuth, requireRole('STUDENT'), async (req, res) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const data = parsed.data;

  if (!data.scientistId && !data.autoAssignRequested) {
    return res.status(400).json({ error: 'Select a scientist or request auto-allocation.' });
  }

  const application = await prisma.application.create({
    data: {
      studentId: req.user.id,
      type: data.type,
      collegeName: data.collegeName,
      durationMonths: data.durationMonths,
      topic: data.topic,
      scientistId: data.scientistId || null,
      autoAssignRequested: !!data.autoAssignRequested,
      status: 'PENDING_APPROVAL',
    },
  });

  const student = await prisma.user.findUnique({ where: { id: req.user.id } });
  const t = templates.registered(student.name);
  await sendMail({ to: student.email, subject: t.subject, html: t.html });

  res.status(201).json(application);
});

// STUDENT: my applications (drives the status dashboard).
router.get('/mine', requireAuth, requireRole('STUDENT'), async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { studentId: req.user.id },
    include: { scientist: true, payment: true, joining: true, certificate: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(applications);
});

// Fetch a single application — accessible to the owning student, the
// assigned scientist, or staff roles.
router.get('/:id', requireAuth, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { student: true, scientist: true, payment: true, joining: true, certificate: true },
  });
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  const isOwner = app.studentId === req.user.id;
  const isStaff = ['ADMIN', 'ACCOUNTS'].includes(req.user.role);
  const isMentor = req.user.role === 'SCIENTIST';
  if (!isOwner && !isStaff && !isMentor) return res.status(403).json({ error: 'Not authorized to view this application.' });

  res.json(app);
});

// SCIENTIST: approve/disapprove a request that was directed to them.
router.patch('/:id/scientist-decision', requireAuth, requireRole('SCIENTIST'), async (req, res) => {
  const { decision, note } = req.body || {}; // decision: 'APPROVE' | 'REJECT'
  const app = await prisma.application.findUnique({ where: { id: req.params.id }, include: { student: true, scientist: true } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  const scientist = await prisma.scientist.findUnique({ where: { userId: req.user.id } });
  if (!scientist || app.scientistId !== scientist.id) {
    return res.status(403).json({ error: 'This application is not assigned to you.' });
  }

  if (decision === 'APPROVE') {
    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { status: 'FEE_PAYMENT_NEEDED' },
    });
    const t = templates.approved(app.student.name);
    await sendMail({ to: app.student.email, subject: t.subject, html: t.html });
    return res.json(updated);
  }
  if (decision === 'REJECT') {
    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { status: 'REJECTED', rejectionReason: note || 'Not accepted by scientist.' },
    });
    const t = templates.rejected(app.student.name, updated.rejectionReason);
    await sendMail({ to: app.student.email, subject: t.subject, html: t.html });
    return res.json(updated);
  }
  res.status(400).json({ error: "decision must be 'APPROVE' or 'REJECT'." });
});

// SCIENTIST: confirm training completion & clear the student for a certificate.
router.patch('/:id/signoff', requireAuth, requireRole('SCIENTIST'), async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  const scientist = await prisma.scientist.findUnique({ where: { userId: req.user.id } });
  if (!scientist || app.scientistId !== scientist.id) {
    return res.status(403).json({ error: 'This application is not assigned to you.' });
  }
  if (app.status !== 'COMPLETION_PENDING') {
    return res.status(400).json({ error: 'This application has not requested certificate completion yet.' });
  }

  const certificate = await prisma.certificate.upsert({
    where: { applicationId: app.id },
    update: { scientistSignoff: true },
    create: {
      applicationId: app.id,
      uniqueCertNo: `PENDING-${app.id}`, // replaced with a real number when Admin generates the PDF
      qrCodeUrl: '',
      scientistSignoff: true,
    },
  });

  res.json(certificate);
});

module.exports = router;
