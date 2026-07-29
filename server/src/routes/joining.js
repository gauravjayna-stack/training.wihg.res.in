const express = require('express');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { makeUploader } = require('../utils/upload');

const router = express.Router();
const uploadJoining = makeUploader('joining');

// STUDENT: submit the physical Joining Form on Day 1 (after fee is verified/waived).
router.post(
  '/:applicationId',
  requireAuth,
  requireRole('STUDENT'),
  uploadJoining.fields([{ name: 'idProof', maxCount: 1 }, { name: 'feeReceipt', maxCount: 1 }]),
  async (req, res) => {
    const app = await prisma.application.findUnique({ where: { id: req.params.applicationId } });
    if (!app || app.studentId !== req.user.id) return res.status(404).json({ error: 'Application not found.' });
    if (app.status !== 'APPROVED_FOR_JOINING') {
      return res.status(400).json({ error: 'This application is not yet cleared for joining.' });
    }

    const { joiningDate } = req.body;
    if (!joiningDate) return res.status(400).json({ error: 'Joining date is required.' });

    const idProofFile = req.files?.idProof?.[0];
    const feeReceiptFile = req.files?.feeReceipt?.[0];

    const joining = await prisma.joiningRecord.create({
      data: {
        applicationId: app.id,
        joiningDate: new Date(joiningDate),
        idProofFile: idProofFile ? `/uploads/joining/${idProofFile.filename}` : null,
        feeReceiptFile: feeReceiptFile ? `/uploads/joining/${feeReceiptFile.filename}` : null,
      },
    });
    await prisma.application.update({ where: { id: app.id }, data: { status: 'ONBOARDED', startDate: new Date(joiningDate) } });

    res.status(201).json(joining);
  }
);

// ADMIN/ACCOUNTS: list joining records still awaiting physical verification.
router.get('/pending', requireAuth, requireRole('ADMIN', 'ACCOUNTS'), async (req, res) => {
  const records = await prisma.joiningRecord.findMany({
    where: { physicalVerificationStatus: 'PENDING' },
    include: { application: { include: { student: true, scientist: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(records);
});

// ADMIN/ACCOUNTS: mark the physical joining verification complete → moves to IN_PROGRESS.
router.patch('/:id/verify', requireAuth, requireRole('ADMIN', 'ACCOUNTS'), async (req, res) => {
  const joining = await prisma.joiningRecord.findUnique({ where: { id: req.params.id } });
  if (!joining) return res.status(404).json({ error: 'Joining record not found.' });

  await prisma.joiningRecord.update({ where: { id: joining.id }, data: { physicalVerificationStatus: 'VERIFIED' } });
  await prisma.application.update({ where: { id: joining.applicationId }, data: { status: 'IN_PROGRESS' } });

  res.json({ ok: true });
});

module.exports = router;
