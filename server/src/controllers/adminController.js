const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

// Master Control - Complete Student CRUD & Audit Logging
exports.updateStudentMaster = async (req, res) => {
  try {
    const { applicationId, topic, scientistId, status, isLocked, actualStartDate, actualEndDate } = req.body;

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        ...(topic && { topic }),
        ...(scientistId && { scientistId }),
        ...(status && { status }),
        ...(typeof isLocked === 'boolean' && { isLocked }),
        ...(actualStartDate && { actualStartDate: new Date(actualStartDate) }),
        ...(actualEndDate && { actualEndDate: new Date(actualEndDate) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'MASTER_UPDATE',
        details: `Updated application ${applicationId}`,
      },
    });

    res.json({ message: 'Record updated with full audit trail.', updated });
  } catch (err) {
    res.status(500).json({ error: 'Master update failed.' });
  }
};

// Admin Signature Upload
exports.uploadAdminSignature = async (req, res) => {
  try {
    const { type, name } = req.body; // DIRECTOR or COORDINATOR
    if (!req.file) return res.status(400).json({ error: 'Signature image is required.' });

    const sig = await prisma.adminSignature.upsert({
      where: { type },
      update: { path: req.file.path, name },
      create: { type, name, path: req.file.path },
    });

    res.json({ message: `${type} signature saved.`, sig });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save admin signature.' });
  }
};

// Final Certificate Generation & Automation
exports.generateFinalCertificate = async (req, res) => {
  try {
    const { approvalId, studentName, topic, duration, remarks } = req.body;

    const updatedApproval = await prisma.certificateApproval.update({
      where: { id: approvalId },
      data: {
        ...(studentName && { studentName }),
        ...(topic && { topic }),
        ...(duration && { duration }),
        ...(remarks && { remarks }),
        status: 'ISSUED',
        pdfPath: `/uploads/certificates/CERT-${approvalId}.pdf`,
      },
      include: {
        application: { include: { student: { include: { user: true } } } },
      },
    });

    // Send Automated Email Notification
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@wihg.res.in',
        to: updatedApproval.application.student.user.email,
        subject: 'WIHG Certificate Issued and Ready for Download',
        text: `Dear ${updatedApproval.studentName},\n\nYour internship/dissertation certificate has been finalized and issued by the Training Cell. You can download it directly from your Student Dashboard.\n\nBest regards,\nWIHG Training Cell`,
      });
    }

    res.json({ message: 'Certificate generated and email dispatched.', approval: updatedApproval });
  } catch (err) {
    console.error('Certificate Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate final certificate.' });
  }
};