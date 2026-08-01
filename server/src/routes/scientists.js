const express = require('express');
const prisma = require('../utils/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendMail } = require('../utils/email');

const router = express.Router();

// Public: list scientists grouped by specialization, for the pre-application
// "Connect with a Scientist" widget on the landing page.
router.get('/', async (req, res) => {
  const scientists = await prisma.scientist.findMany({
    select: { id: true, name: true, specialization: true, email: true, availableSeats: true },
    orderBy: { specialization: 'asc' },
  });
  res.json(scientists);
});

// Public: send a pre-contact inquiry email to a scientist.
router.post('/:id/contact', async (req, res) => {
  const { id } = req.params;
  const { studentName, studentEmail, message, proposedDuration } = req.body || {};
  if (!studentName || !studentEmail || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  const scientist = await prisma.scientist.findUnique({ where: { id } });
  if (!scientist) return res.status(404).json({ error: 'Scientist not found.' });

  await sendMail({
    to: scientist.email,
    subject: `WIHG Portal: Internship/Dissertation inquiry from ${studentName}`,
    html: `<p>Dear Dr. ${scientist.name},</p>
      <p>You have received a new inquiry via the WIHG Training Portal:</p>
      <p><b>Name:</b> ${studentName}<br/>
         <b>Email:</b> ${studentEmail}<br/>
         <b>Proposed duration:</b> ${proposedDuration || 'Not specified'}</p>
      <p><b>Message:</b><br/>${message}</p>
      <p>Please reply directly to the student's email above if you wish to accept them,
      and ask them to reference your approval in their formal Application Form.</p>`,
  });

  res.json({ ok: true, message: 'Your inquiry has been sent to the scientist.' });
});

// Scientist dashboard: applications assigned/pre-contacted to me.
router.get('/me/applications', requireAuth, requireRole('SCIENTIST'), async (req, res) => {
  const scientist = await prisma.scientist.findUnique({ where: { userId: req.user.id } });
  if (!scientist) return res.status(404).json({ error: 'Scientist profile not found for this account.' });

  const applications = await prisma.application.findMany({
    where: { scientistId: scientist.id },
    include: { student: { select: { name: true, email: true, phone: true } }, payment: true, joining: true, certificate: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(applications);
});

module.exports = router;