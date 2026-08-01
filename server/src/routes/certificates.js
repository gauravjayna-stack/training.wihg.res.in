const express = require('express');
const path = require('path');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { makeUploader } = require('../utils/upload');
const { generateCertificatePdf, buildCertNo } = require('../utils/certificate');
const { sendMail, templates } = require('../utils/email');

const router = express.Router();
const uploadReport = makeUploader('reports');

// STUDENT: submit final report
router.post('/:applicationId/request', requireAuth, requireRole('STUDENT'), uploadReport.single('report'), async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.applicationId } });
  if (!app || app.studentId !== req.user.id) return res.status(404).json({ error: 'Application not found.' });
  if (app.status !== 'IN_PROGRESS') {
    return res.status(400).json({ error: 'Certificates can only be requested once your tenure is in progress/complete.' });
  }
  if (!req.file) return res.status(400).json({ error: 'A final report/thesis PDF is required.' });

  await prisma.certificate.upsert({
    where: { applicationId: app.id },
    update: { reportFilePath: `/uploads/reports/${req.file.filename}`, feedbackSubmitted: true },
    create: {
      applicationId: app.id,
      uniqueCertNo: `PENDING-${app.id}`,
      qrCodeUrl: '',
      reportFilePath: `/uploads/reports/${req.file.filename}`,
      feedbackSubmitted: true,
    },
  });
  await prisma.application.update({ where: { id: app.id }, data: { status: 'COMPLETION_PENDING', topic: req.body.topic || app.topic } });

  res.status(201).json({ ok: true });
});

// PUBLIC: certificate verification
router.get('/verify/:certNo', async (req, res) => {
  const certNo = decodeURIComponent(req.params.certNo);
  const certificate = await prisma.certificate.findUnique({
    where: { uniqueCertNo: certNo },
    include: { application: { include: { student: true, scientist: true } } },
  });
  if (!certificate || !certificate.adminApproved) {
    return res.status(404).json({ valid: false, message: 'No issued certificate found for this ID.' });
  }
  res.json({
    valid: true,
    certNo: certificate.uniqueCertNo,
    studentName: certificate.application.student.name,
    type: certificate.application.type,
    topic: certificate.application.topic,
    mentor: certificate.application.scientist?.name,
    startDate: certificate.application.startDate,
    endDate: certificate.application.endDate,
    issueDate: certificate.issueDate,
  });
});

// ADMIN: generate certificate
router.post('/:applicationId/generate', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.applicationId },
    include: { student: true, scientist: true, certificate: true },
  });
  if (!app) return res.status(404).json({ error: 'Application not found.' });
  if (!app.certificate || !app.certificate.scientistSignoff) {
    return res.status(400).json({ error: 'The scientist has not yet signed off on this student\'s completion.' });
  }
  if (app.certificate.adminApproved) {
    return res.status(400).json({ error: 'Certificate has already been issued for this application.' });
  }

  const sequence = (await prisma.certificate.count({ where: { adminApproved: true } })) + 1;
  const certNo = buildCertNo(sequence);
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;

  const { pdfPath, qrCodeUrl } = await generateCertificatePdf({
    certNo,
    studentName: app.student.name,
    type: app.type,
    topic: app.topic,
    mentorName: app.scientist?.name || 'Training Cell, WIHG',
    startDate: app.startDate ? app.startDate.toLocaleDateString('en-IN') : '—',
    endDate: app.endDate ? app.endDate.toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    publicBaseUrl,
  });

  const certificate = await prisma.certificate.update({
    where: { applicationId: app.id },
    data: { uniqueCertNo: certNo, qrCodeUrl, pdfPath, adminApproved: true, issueDate: new Date() },
  });
  await prisma.application.update({ where: { id: app.id }, data: { status: 'CERTIFICATE_READY', endDate: app.endDate || new Date() } });

  const t = templates.certificateIssued(app.student.name, certNo);
  const attachmentPath = certificate.pdfPath ? path.join(__dirname, '..', '..', certificate.pdfPath) : undefined;
  await sendMail({
    to: app.student.email,
    subject: t.subject,
    html: t.html,
    attachments: attachmentPath ? [{ filename: `${certNo.replace(/\//g, '_')}.pdf`, path: attachmentPath }] : undefined,
  });

  res.json(certificate);
});

module.exports = router;