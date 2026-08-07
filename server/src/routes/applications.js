const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendMail, templates } = require('../utils/email');

const router = express.Router();

const applySchema = z.object({
  type: z.enum(['INTERNSHIP', 'DISSERTATION']),
  year: z.string().optional(),
  fullName: z.string().optional(),
  fatherOrHusbandName: z.string().min(1, "Father's / Husband's Name is required"),
  addressCorrespondence: z.string().min(1, 'Address for Correspondence is required'),
  addressPermanent: z.string().min(1, 'Permanent Address is required'),
  phoneNo: z.string().optional(),
  email: z.string().optional(),
  dob: z.string().optional(),
  placeOfBirth: z.string().optional(),
  ageYears: z.union([z.number(), z.string()]).optional(),
  ageMonths: z.union([z.number(), z.string()]).optional(),
  ageDays: z.union([z.number(), z.string()]).optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  identificationMark: z.string().optional(),
  nationality: z.string().optional(),
  category: z.string().optional(),
  academicRecords: z.any().optional(),
  punishedDetails: z.string().optional(),
  prizesAndAwards: z.string().optional(),
  specialTraining: z.string().optional(),
  researchInterest: z.string().min(1, 'Research Interest is required'),
  collegeName: z.string().optional(),
  degreeName: z.string().optional(),
  durationMonths: z.union([z.number(), z.string()]).optional(),
  topic: z.string().optional(),
  scientistId: z.string().optional(),
  autoAssignRequested: z.boolean().optional(),
});

// STUDENT: submit the Application Form
router.post('/', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const data = parsed.data;

    if (!data.scientistId && !data.autoAssignRequested) {
      return res.status(400).json({ error: 'Select a scientist or request auto-allocation.' });
    }

    // Fetch user details from database to enforce locked registration data
    const studentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!studentUser) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    // Save application using registered user info for locked fields
    const application = await prisma.application.create({
      data: {
        studentId: req.user.id,
        type: data.type,
        year: data.year || new Date().getFullYear().toString(),
        fullName: studentUser.name || studentUser.fullName || data.fullName,
        email: studentUser.email,
        phoneNo: studentUser.phone || data.phoneNo,
        collegeName: studentUser.collegeName || data.collegeName || 'N/A',
        degreeName: studentUser.degreeName || data.degreeName || null,
        fatherOrHusbandName: data.fatherOrHusbandName,
        addressCorrespondence: data.addressCorrespondence,
        addressPermanent: data.addressPermanent,
        dob: data.dob ? new Date(data.dob) : null,
        placeOfBirth: data.placeOfBirth || null,
        ageYears: data.ageYears ? parseInt(data.ageYears) : null,
        ageMonths: data.ageMonths ? parseInt(data.ageMonths) : null,
        ageDays: data.ageDays ? parseInt(data.ageDays) : null,
        gender: data.gender || 'Male',
        maritalStatus: data.maritalStatus || 'Single',
        identificationMark: data.identificationMark || null,
        nationality: data.nationality || 'Indian',
        category: data.category || 'General',
        academicRecords: data.academicRecords ? JSON.stringify(data.academicRecords) : null,
        punishedDetails: data.punishedDetails || null,
        prizesAndAwards: data.prizesAndAwards || null,
        specialTraining: data.specialTraining || null,
        researchInterest: data.researchInterest,
        durationMonths: data.durationMonths ? parseInt(data.durationMonths) : 1,
        topic: data.topic || null,
        scientistId: data.scientistId || null,
        autoAssignRequested: !!data.autoAssignRequested,
        status: 'PENDING_APPROVAL',
      },
    });

    if (studentUser.email) {
      const t = templates.registered(studentUser.name);
      await sendMail({ to: studentUser.email, subject: t.subject, html: t.html });
    }

    res.status(201).json(application);
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

// STUDENT: my applications
router.get('/mine', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { studentId: req.user.id },
      include: { scientist: true, payment: true, joining: true, certificate: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  } catch (error) {
    console.error('Fetch student applications error:', error);
    res.json([]);
  }
});

// Staff/Admin fetching route
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status && status !== 'ALL' ? { status } : {};

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: true,
        scientist: true,
        payment: true,
        joining: true,
        certificate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(applications || []);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.json([]);
  }
});

// SCIENTIST: approve/disapprove
router.patch('/:id/scientist-decision', requireAuth, requireRole('SCIENTIST'), async (req, res) => {
  try {
    const { decision, note } = req.body || {};
    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { student: true, scientist: true },
    });
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
      if (app.student?.email) {
        const t = templates.approved(app.student.name);
        await sendMail({ to: app.student.email, subject: t.subject, html: t.html });
      }
      return res.json(updated);
    }
    if (decision === 'REJECT') {
      const updated = await prisma.application.update({
        where: { id: app.id },
        data: { status: 'REJECTED', rejectionReason: note || 'Not accepted by scientist.' },
      });
      if (app.student?.email) {
        const t = templates.rejected(app.student.name, updated.rejectionReason);
        await sendMail({ to: app.student.email, subject: t.subject, html: t.html });
      }
      return res.json(updated);
    }
    res.status(400).json({ error: "decision must be 'APPROVE' or 'REJECT'." });
  } catch (error) {
    console.error('Scientist decision error:', error);
    res.status(500).json({ error: 'Failed to process scientist decision.' });
  }
});

// SCIENTIST: confirm completion & sign off
router.patch('/:id/signoff', requireAuth, requireRole('SCIENTIST'), async (req, res) => {
  try {
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
        uniqueCertNo: `PENDING-${app.id}`,
        qrCodeUrl: '',
        scientistSignoff: true,
      },
    });

    res.json(certificate);
  } catch (error) {
    console.error('Signoff error:', error);
    res.status(500).json({ error: 'Failed to complete signoff.' });
  }
});

module.exports = router;