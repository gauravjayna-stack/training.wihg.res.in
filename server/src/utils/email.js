const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

/**
 * Sends an email. Never throws — logs and swallows errors so that a
 * misconfigured/offline SMTP server never breaks the calling workflow
 * (e.g. an application approval should succeed even if the email fails).
 */
async function sendMail({ to, subject, html, attachments }) {
  if (!to) return;
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
    });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

const templates = {
  registered: (name) => ({
    subject: 'WIHG: Application received',
    html: `<p>Dear ${name},</p><p>Your Internship/Dissertation application has been received by the WIHG Training Cell and is pending review.</p><p>Regards,<br/>WIHG Training Cell</p>`,
  }),
  approved: (name) => ({
    subject: 'WIHG: Application approved — fee payment required',
    html: `<p>Dear ${name},</p><p>Your application has been approved. Please log in to the portal and upload your fee payment details (UTR/transaction number and receipt) to proceed.</p><p>Regards,<br/>WIHG Training Cell</p>`,
  }),
  rejected: (name, reason) => ({
    subject: 'WIHG: Application status update',
    html: `<p>Dear ${name},</p><p>We regret to inform you that your application was not approved.${reason ? ` Reason: ${reason}` : ''}</p><p>Regards,<br/>WIHG Training Cell</p>`,
  }),
  paymentVerified: (name) => ({
    subject: 'WIHG: Fee payment verified',
    html: `<p>Dear ${name},</p><p>Your fee payment has been verified by the Accounts section. You may now proceed to submit your physical Joining Form on your reporting day.</p><p>Regards,<br/>WIHG Accounts Section</p>`,
  }),
  certificateIssued: (name, certNo) => ({
    subject: 'WIHG: Certificate issued',
    html: `<p>Dear ${name},</p><p>Congratulations! Your certificate (No. ${certNo}) has been generated and is attached, and is also available for download from your dashboard.</p><p>Regards,<br/>WIHG Training Cell</p>`,
  }),
};

module.exports = { sendMail, templates };
