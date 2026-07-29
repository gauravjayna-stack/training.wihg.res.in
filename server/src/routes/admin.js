const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendMail, templates } = require('../utils/email');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

// List all applications (with filters) for the Training Cell processing queue.
router.get('/applications', async (req, res) => {
  const { status, type, discipline } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (discipline) where.scientist = { specialization: discipline };

  const applications = await prisma.application.findMany({
    where,
    include: { student: true, scientist: true, payment: true, joining: true, certificate: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(applications);
});

// Approve or reject a pending application (only used when no scientist
// decision is required, e.g. auto-allocation path, or Admin override).
router.patch('/applications/:id/decision', async (req, res) => {
  const { decision, note } = req.body || {};
  const app = await prisma.application.findUnique({ where: { id: req.params.id }, include: { student: true } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  if (decision === 'APPROVE') {
    const updated = await prisma.application.update({ where: { id: app.id }, data: { status: 'FEE_PAYMENT_NEEDED' } });
    const t = templates.approved(app.student.name);
    await sendMail({ to: app.student.email, subject: t.subject, html: t.html });
    return res.json(updated);
  }
  if (decision === 'REJECT') {
    const updated = await prisma.application.update({ where: { id: app.id }, data: { status: 'REJECTED', rejectionReason: note || 'Not approved.' } });
    const t = templates.rejected(app.student.name, updated.rejectionReason);
    await sendMail({ to: app.student.email, subject: t.subject, html: t.html });
    return res.json(updated);
  }
  res.status(400).json({ error: "decision must be 'APPROVE' or 'REJECT'." });
});

// Auto-allocate an unassigned application to the best-matching scientist
// with available seats. Once assigned, the mentor is locked (no reassignment
// via this route — that requires a manual DB/support action by design).
router.patch('/applications/:id/auto-allocate', async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (app.scientistId) return res.status(400).json({ error: 'This application already has an assigned mentor.' });

  const { scientistId } = req.body || {};
  let scientist;
  if (scientistId) {
    scientist = await prisma.scientist.findUnique({ where: { id: scientistId } });
  } else {
    // naive matching: any scientist with available seats, most free seats first
    scientist = await prisma.scientist.findFirst({ where: { availableSeats: { gt: 0 } }, orderBy: { availableSeats: 'desc' } });
  }
  if (!scientist) return res.status(400).json({ error: 'No scientist with available seats found. Specify scientistId manually.' });

  const updated = await prisma.application.update({ where: { id: app.id }, data: { scientistId: scientist.id } });
  await prisma.scientist.update({ where: { id: scientist.id }, data: { availableSeats: { decrement: 1 } } });
  res.json(updated);
});

// EWS Fee Waiver: Admin/Director approval with a note (an uploaded scan of
// the official waiver order is stored via the receipts upload flow and its
// path can be attached in `waiverReason`/a separate field if desired).
router.patch('/applications/:id/waiver', async (req, res) => {
  const { approve, reason } = req.body || {};
  const app = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  const updated = await prisma.application.update({
    where: { id: app.id },
    data: {
      feeWaived: !!approve,
      waiverReason: approve ? (reason || 'EWS fee waiver approved by Director.') : null,
      status: approve ? 'APPROVED_FOR_JOINING' : app.status,
    },
  });
  res.json(updated);
});

// Global analytics dashboard.
router.get('/analytics', async (req, res) => {
  const [totalInterns, totalDissertations, byStatus, byDiscipline, byYear] = await Promise.all([
    prisma.application.count({ where: { type: 'INTERNSHIP' } }),
    prisma.application.count({ where: { type: 'DISSERTATION' } }),
    prisma.application.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.scientist.findMany({
      select: { specialization: true, _count: { select: { applications: true } } },
    }),
    prisma.$queryRawUnsafe(
      `SELECT strftime('%Y', createdAt) as year, COUNT(*) as count FROM Application GROUP BY year ORDER BY year DESC`
    ),
  ]);

  res.json({
    totalInterns,
    totalDissertations,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
    byDiscipline: byDiscipline.map((s) => ({ discipline: s.specialization, count: s._count.applications })),
    byYear,
  });
});

// CSV export, filterable by year/discipline/supervisor/fee status.
router.get('/export.csv', async (req, res) => {
  const { year, discipline, supervisor, feeStatus } = req.query;
  const where = {};
  if (discipline) where.scientist = { specialization: discipline };
  if (supervisor) where.scientist = { ...where.scientist, name: supervisor };
  if (feeStatus) where.payment = { status: feeStatus };

  let applications = await prisma.application.findMany({
    where,
    include: { student: true, scientist: true, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  if (year) applications = applications.filter((a) => new Date(a.createdAt).getFullYear().toString() === year);

  const header = 'Student Name,Email,Type,College,Scientist,Status,Fee Status,Fee Waived,Start Date,End Date\n';
  const rows = applications
    .map((a) =>
      [
        a.student.name,
        a.student.email,
        a.type,
        a.collegeName,
        a.scientist?.name || 'Unassigned',
        a.status,
        a.payment?.status || 'N/A',
        a.feeWaived ? 'YES' : 'NO',
        a.startDate ? a.startDate.toISOString().slice(0, 10) : '',
        a.endDate ? a.endDate.toISOString().slice(0, 10) : '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="wihg_applications_export.csv"');
  res.send(header + rows);
});

// Staff user management: create SCIENTIST / ACCOUNTS / ADMIN accounts.
// (Students self-register via /api/auth/register.)
router.post('/users', async (req, res) => {
  const { name, email, password, role, specialization, availableSeats } = req.body || {};
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'name, email, password, and role are required.' });
  if (!['ADMIN', 'ACCOUNTS', 'SCIENTIST'].includes(role)) return res.status(400).json({ error: 'Invalid role for staff creation.' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  if (role === 'SCIENTIST') {
    await prisma.scientist.create({
      data: { userId: user.id, name, email, specialization: specialization || 'General Geology', availableSeats: availableSeats ?? 2 },
    });
  }
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.get('/scientists', async (req, res) => {
  const scientists = await prisma.scientist.findMany({ orderBy: { specialization: 'asc' } });
  res.json(scientists);
});

module.exports = router;
