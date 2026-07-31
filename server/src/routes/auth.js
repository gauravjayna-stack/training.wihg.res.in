const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma'); // Adjust relative path if needed

const router = express.Router();

// Existing login route...
// router.post('/login', ...)

// 1. CHANGE PASSWORD ROUTE (Requires Email, Old Password, and New Password)
router.post('/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body || {};

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required.' });
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User with this email does not exist.' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Hash new password and save
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    return res.json({ message: 'Password updated successfully! You can now log in.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

// 2. FORGOT PASSWORD ROUTE
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success message for security so users cannot probe valid emails
      return res.json({ message: 'If an account exists for this email, instructions have been logged/sent.' });
    }

    // Note: If you have an email server configured (e.g. Nodemailer),
    // you would issue a reset link or temporary password here.
    return res.json({ message: 'Password reset request received. Please contact admin or check your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
});

module.exports = router;