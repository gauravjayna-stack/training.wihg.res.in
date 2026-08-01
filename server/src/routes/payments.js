const express = require('express');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { makeUploader } = require('../utils/upload');
const { sendMail, templates } = require('../utils/email');

const router = express.Router();
const uploadReceipt = makeUploader('receipts');

// STUDENT: upload fee payment details
router.post('/:applicationId', requireAuth, requireRole('STUDENT'), uploadReceipt.single('receipt'), async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.applicationId } });
  if (!app || app.studentId !== req.user.id) return res.status(404).json({ error: 'Application not found.' });
  if (app.status !== 'FEE_PAYMENT_NEEDED') {
    return res.status(400).json({ error: 'This application is not awaiting fee payment.' });
  }
  if (!req.file) return res.status(400).json({ error: 'A receipt file (PDF/JPG/PNG) is required.' });

  const { utrNumber, amount } = req.body;
  if (!utrNumber || !amount) return res.status(400).json({ error: 'UTR/transaction number and amount are required.' });

  const payment = await prisma.payment.create({
    data: {
      applicationId: app.id,
      utrNumber,
      amount: parseFloat(amount),
      receiptFile: `/uploads/receipts/${req.file.filename}`,
      status: 'PENDING',
    },
  });
  await prisma.application.update({ where: { id: app.id }, data: { status: 'VERIFICATION_PENDING' } });

  res.status(201).json(payment);
});

// ACCOUNTS: list pending
router.get('/pending', requireAuth, requireRole('ACCOUNTS', 'ADMIN'), async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { status: 'PENDING' },
    include: { application: { include: { student: true, scientist: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(payments);
});

// ACCOUNTS: verify or reject
router.patch('/:id/decision', requireAuth, requireRole('ACCOUNTS', 'ADMIN'), async (req, res) => {
  const { decision } = req.body || {};
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { application: { include: { student: true } } } });
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });

  if (decision === 'VERIFY') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'VERIFIED', verifiedById: req.user.id, verifiedAt: new Date() },
    });
    await prisma.application.update({ where: { id: payment.applicationId }, data: { status: 'APPROVED_FOR_JOINING' } });
    const t = templates.paymentVerified(payment.application.student.name);
    await sendMail({ to: payment.application.student.email, subject: t.subject, html: t.html });
    return res.json({ ok: true });
  }
  if (decision === 'REJECT') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'REJECTED' } });
    await prisma.application.update({ where: { id: payment.applicationId }, data: { status: 'FEE_PAYMENT_NEEDED' } });
    return res.json({ ok: true });
  }
  res.status(400).json({ error: "decision must be 'VERIFY' or 'REJECT'." });
});

module.exports = router;