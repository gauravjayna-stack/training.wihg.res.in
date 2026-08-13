const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendMail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'wihg-secret-key-2026';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, collegeName, degreeName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!collegeName || !degreeName) {
      return res.status(400).json({ error: 'College Name and Degree Name are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        collegeName,
        degreeName,
        role: 'STUDENT',
      },
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        collegeName: user.collegeName,
        degreeName: user.degreeName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET LOGGED IN USER DATA
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        collegeName: true,
        degreeName: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// FORGOT PASSWORD: no reset-link email infrastructure exists yet, so this
// generates a new temporary password and emails it to the account on file.
// Always returns the same generic message so the endpoint can't be used to
// discover which emails are registered.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const genericMessage = 'If an account exists for that email, password reset instructions have been sent.';
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const tempPassword = crypto.randomBytes(6).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      await sendMail({
        to: user.email,
        subject: 'WIHG Portal: Temporary password',
        html: `<p>Dear ${user.name},</p>
          <p>A password reset was requested for your WIHG Training Portal account. Your temporary password is:</p>
          <p style="font-size:16px;font-weight:bold;">${tempPassword}</p>
          <p>Please log in and use "Change password" to set a new password of your choice.</p>
          <p>If you did not request this, please contact the Training Cell immediately.</p>`,
      });
    }
    res.json({ message: genericMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return the generic message — don't leak whether the account exists.
    res.json({ message: genericMessage });
  }
});

// CHANGE PASSWORD: requires the current password.
router.post('/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body || {};
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or current password.' });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or current password.' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

module.exports = router;