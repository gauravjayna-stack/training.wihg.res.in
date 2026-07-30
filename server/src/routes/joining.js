const express = require('express');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { makeUploader } = require('../utils/upload');

const router = express.Router();
const uploadJoining = makeUploader('joining');

// STUDENT: submit the physical Joining Form on Day 1
router.post(
  '/:applicationId',
  requireAuth,
  requireRole('STUDENT'),
  uploadJoining.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'collegeId', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'identityProof', maxCount: 1 },
    { name: 'feeReceipt', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const app = await prisma.application.findUnique({ where: { id: req.params.applicationId } });
      if (!app || app.studentId !== req.user.id) {
        return res.status(404).json({ error: 'Application not found.' });
      }
      if (app.status !== 'APPROVED_FOR_JOINING') {
        return res.status(400).json({ error: 'This application is not yet cleared for joining.' });
      }

      const { joiningDate } = req.body;
      if (!joiningDate) {
        return res.status(400).json({ error: 'Joining date is required.' });
      }

      // Safe retrieval of uploaded files (supporting various field names from UI)
      const idProofFile = req.files?.idProof?.[0] || req.files?.identityProof?.[0] || req.files?.collegeId?.[0];
      const feeReceiptFile = req.files?.feeReceipt?.[0];

      const joining = await prisma.joiningRecord.create({
        data: {
          applicationId: app.id,
          joiningDate: new Date(joiningDate),
          idProofFile: idProofFile ? `/uploads/joining/${idProofFile.filename}` : null,
          feeReceiptFile: feeReceiptFile ? `/uploads/joining/${feeReceiptFile.filename}` : null,
        },
      });

      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'ONBOARDED', startDate: new Date(joiningDate) },
      });

      res.status(201).json(joining);
    } catch (error) {
      console.error('Joining form submission error:', error);
      res.status(500).json({ error: 'Failed to process joining submission.' });
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