const express = require('express');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { makeUploader } = require('../utils/upload');

const router = express.Router();
const uploadJoining = makeUploader('joining');

// Helper to generate a unique Enrolment Number
async function generateEnrolmentNo() {
  const year = new Date().getFullYear();
  const count = await prisma.joiningRecord.count();
  const serial = String(count + 1).padStart(3, '0');
  return `WIHG/${year}/${serial}`;
}

// GET pre-fill details for Day 1 Joining Form
router.get('/prefill/:applicationId', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      include: { student: true, scientist: true },
    });

    if (!app || app.studentId !== req.user.id) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (app.status !== 'APPROVED_FOR_JOINING') {
      return res.status(400).json({ error: 'This application is not cleared for joining.' });
    }

    const enrolmentNo = await generateEnrolmentNo();

    const existingJoining = await prisma.joiningRecord.findUnique({
      where: { applicationId: app.id },
    });

    return res.json({
      applicationId: app.id,
      enrolmentNo: existingJoining?.enrolmentNo || enrolmentNo,
      type: app.type,
      name: app.student?.name || '',
      email: app.student?.email || '',
      phone: app.student?.phone || '',
      fatherName: app.fatherName || '',
      dob: app.dob ? new Date(app.dob).toISOString().slice(0, 10) : '',
      gender: app.gender || '',
      collegeName: app.collegeName || '',
      nationality: app.nationality || 'Indian',
      address: app.address || '',
      alreadySubmitted: !!existingJoining,
    });
  } catch (error) {
    console.error('Fetch prefill joining error:', error);
    return res.status(500).json({ error: 'Failed to fetch application details.' });
  }
});

// STUDENT: submit physical Joining Form on Day 1
router.post(
  '/:applicationId',
  requireAuth,
  requireRole('STUDENT'),
  uploadJoining.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'collegeId', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'feeReceipt', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const app = await prisma.application.findUnique({
        where: { id: req.params.applicationId },
        include: { student: true },
      });

      if (!app || app.studentId !== req.user.id) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      if (app.status !== 'APPROVED_FOR_JOINING') {
        return res.status(400).json({ error: 'This application is not yet cleared for joining.' });
      }

      const {
        joiningDate,
        durationFrom,
        durationTo,
        declarationAccepted,
      } = req.body;

      if (!declarationAccepted || declarationAccepted === 'false') {
        return res.status(400).json({ error: 'You must accept the declaration to submit the joining form.' });
      }

      if (!joiningDate || !durationFrom || !durationTo) {
        return res.status(400).json({ error: 'Joining date and duration dates are required.' });
      }

      const parseSafeDate = (d) => {
        if (!d) return null;
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const startDate = parseSafeDate(durationFrom);
      const endDate = parseSafeDate(durationTo);

      if (!startDate || !endDate || endDate <= startDate) {
        return res.status(400).json({ error: 'End date must be after start date.' });
      }

      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.round(diffDays / 30);

      if (app.type === 'INTERNSHIP') {
        if (diffDays < 28 || diffMonths > 3) {
          return res.status(400).json({ error: 'Internship duration must be between 1 month and 3 months.' });
        }
      } else if (app.type === 'DISSERTATION') {
        if (diffDays < 28 || diffMonths > 6) {
          return res.status(400).json({ error: 'Dissertation duration must be between 1 month and 6 months.' });
        }
      }

      const photoFile = req.files?.photo?.[0];
      const collegeIdFile = req.files?.collegeId?.[0];
      const idProofFile = req.files?.idProof?.[0];
      const feeReceiptFile = req.files?.feeReceipt?.[0];

      if (!photoFile || !collegeIdFile || !idProofFile || !feeReceiptFile) {
        return res.status(400).json({
          error: 'All mandatory enclosures (Passport Photo, College ID, Identity Proof, and Fee Receipt) must be uploaded.',
        });
      }

      // STRICTLY MINIMAL FIELD MAP - ONLY EXACT COLUMNS CONFIRMED IN YOUR DB SCHEMA
      const joiningData = {
        joiningDate: parseSafeDate(joiningDate) || new Date(),
        photoFile: `/uploads/joining/${photoFile.filename}`,
        collegeIdFile: `/uploads/joining/${collegeIdFile.filename}`,
        idProofFile: `/uploads/joining/${idProofFile.filename}`,
        feeReceiptFile: `/uploads/joining/${feeReceiptFile.filename}`,
      };

      const joining = await prisma.joiningRecord.upsert({
        where: { applicationId: app.id },
        update: joiningData,
        create: {
          applicationId: app.id,
          ...joiningData,
        },
      });

      await prisma.application.update({
        where: { id: app.id },
        data: {
          status: 'ONBOARDED',
          startDate,
          endDate,
        },
      });

      res.status(201).json(joining);
    } catch (error) {
      console.error('Joining form submission error details:', error);
      res.status(500).json({ error: error.message || 'Failed to process joining submission.' });
    }
  }
);

// ADMIN/ACCOUNTS: list joining records awaiting physical verification
router.get('/pending', requireAuth, requireRole('ADMIN', 'ACCOUNTS'), async (req, res) => {
  try {
    const records = await prisma.joiningRecord.findMany({
      where: { physicalVerificationStatus: 'PENDING' },
      include: { application: { include: { student: true, scientist: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(records || []);
  } catch (error) {
    console.error('Fetch pending joinings error:', error);
    res.json([]);
  }
});

// ADMIN/ACCOUNTS: mark physical joining verification complete
router.patch('/:id/verify', requireAuth, requireRole('ADMIN', 'ACCOUNTS'), async (req, res) => {
  try {
    const joining = await prisma.joiningRecord.findUnique({ where: { id: req.params.id } });
    if (!joining) return res.status(404).json({ error: 'Joining record not found.' });

    await prisma.joiningRecord.update({
      where: { id: joining.id },
      data: { physicalVerificationStatus: 'VERIFIED' },
    });
    await prisma.application.update({
      where: { id: joining.applicationId },
      data: { status: 'IN_PROGRESS' },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Verify joining error:', error);
    res.status(500).json({ error: 'Failed to verify joining record.' });
  }
});
module.exports = router;