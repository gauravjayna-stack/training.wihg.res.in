const express = require('express');
const { z } = require('zod');
const multer = require('multer');
const path = require('path');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendMail, templates } = require('../utils/email');

const router = express.Router();

// Multer Storage Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Zod Schema matching FormData values sent by ApplyForm.jsx
const applySchema = z.object({
  type: z.enum(['INTERNSHIP', 'DISSERTATION']).default('INTERNSHIP'),
  year: z.string().optional().default(() => new Date().getFullYear().toString()),
  fullName: z.string().optional(),
  fatherOrHusbandName: z.string().min(1, "Father's / Husband's Name is required"),
  addressCorrespondence: z.string().min(1, 'Address for Correspondence is required'),
  addressPermanent: z.string().min(1, 'Permanent Address is required'),
  phoneNo: z.string().optional(),
  email: z.string().optional(),
  dob: z.string().optional(),
  placeOfBirth: z.string().optional(),
  ageYears: z.union([z.number(), z.string()]).optional().transform((val) => (val ? parseInt(val) : null)),
  ageMonths: z.union([z.number(), z.string()]).optional().transform((val) => (val ? parseInt(val) : null)),
  ageDays: z.union([z.number(), z.string()]).optional().transform((val) => (val ? parseInt(val) : null)),
  gender: z.string().optional().default('Male'),
  maritalStatus: z.string().optional().default('Single'),
  identificationMark: z.string().optional(),
  nationality: z.string().optional().default('Indian'),
  category: z.string().optional().default('General'),
  academicRecords: z.string().optional(),
  punishedDetails: z.string().optional(),
  prizesAndAwards: z.string().optional(),
  specialTraining: z.string().optional(),
  researchInterest: z.string().min(1, 'Research Interest is required'),
  collegeName: z.string().optional().default('N/A'),
  durationMonths: z.union([z.number(), z.string()]).optional().transform((val) => (val ? parseInt(val) : 1)),
  topic: z.string().optional(),
  scientistId: z.string().optional().nullable(),
  autoAssignRequested: z.union([z.boolean(), z.string()]).optional().transform((val) => val === true || val === 'true'),
});

// STUDENT: submit Application Form
router.post(
  '/',
  requireAuth,
  requireRole('STUDENT'),
  upload.fields([
    { name: 'hodLetter', maxCount: 1 },
    { name: 'categoryCert', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // 1. Validate Form Text Fields
      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const data = parsed.data;

      // 2. Validate Scientist Selection / Auto Allocation
      if (!data.scientistId && !data.autoAssignRequested) {
        return res.status(400).json({ error: 'Select a scientist or request auto-allocation.' });
      }

      // 3. Verify Mandatory File Upload (HOD Letter)
      if (!req.files || !req.files.hodLetter || !req.files.hodLetter[0]) {
        return res.status(400).json({ error: 'Please attach the HOD Forwarding / Recommendation Letter (PDF).' });
      }

      const hodLetterUrl = req.files.hodLetter[0].path;
      const categoryCertUrl = req.files.categoryCert ? req.files.categoryCert[0].path : null;

      // 4. Verify Student Profile
      const studentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!studentUser) {
        return res.status(404).json({ error: 'Student account not found.' });
      }

      // 5. Parse Academic Records safely
      let formattedAcademicRecords = null;
      if (data.academicRecords) {
        try {
          formattedAcademicRecords = typeof data.academicRecords === 'string' 
            ? data.academicRecords 
            : JSON.stringify(data.academicRecords);
        } catch (e) {
          formattedAcademicRecords = null;
        }
      }

      // 6. Create Application Record in Database
      const application = await prisma.application.create({
        data: {
          studentId: req.user.id,
          type: data.type,
          year: data.year || new Date().getFullYear().toString(),
          fullName: studentUser.name || studentUser.fullName || data.fullName || 'Student',
          email: studentUser.email,
          phoneNo: studentUser.phone || studentUser.phoneNo || data.phoneNo || 'N/A',
          fatherOrHusbandName: data.fatherOrHusbandName,
          addressCorrespondence: data.addressCorrespondence,
          addressPermanent: data.addressPermanent,
          dob: data.dob ? new Date(data.dob) : null,
          placeOfBirth: data.placeOfBirth || null,
          ageYears: data.ageYears,
          ageMonths: data.ageMonths,
          ageDays: data.ageDays,
          gender: data.gender || 'Male',
          maritalStatus: data.maritalStatus || 'Single',
          identificationMark: data.identificationMark || null,
          nationality: data.nationality || 'Indian',
          category: data.category || 'General',
          academicRecords: formattedAcademicRecords,
          punishedDetails: data.punishedDetails || null,
          prizesAndAwards: data.prizesAndAwards || null,
          specialTraining: data.specialTraining || null,
          researchInterest: data.researchInterest,
          collegeName: data.collegeName || 'N/A',
          durationMonths: data.durationMonths || 1,
          topic: data.topic || null,
          scientistId: data.scientistId || null,
          autoAssignRequested: data.autoAssignRequested,
          hodLetterUrl: hodLetterUrl,
          categoryCertUrl: categoryCertUrl,
          status: 'PENDING_APPROVAL',
        },
      });

      // 7. Send Confirmation Email
      if (studentUser.email && templates?.registered) {
        try {
          const t = templates.registered(studentUser.name || 'Student');
          await sendMail({ to: studentUser.email, subject: t.subject, html: t.html });
        } catch (emailErr) {
          console.error('Email notification failed:', emailErr);
        }
      }

      return res.status(201).json(application);
    } catch (error) {
      console.error('Submit application error:', error);
      return res.status(500).json({ error: 'Failed to submit application.' });
    }
  }
);

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

// GET /api/applications
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

// SCIENTIST: decision
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
      if (app.student?.email && templates?.approved) {
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
      if (app.student?.email && templates?.rejected) {
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

// SCIENTIST: signoff
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