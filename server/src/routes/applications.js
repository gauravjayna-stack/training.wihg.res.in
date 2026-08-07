const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'wihg-secret-key-2026';

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

router.get('/', authenticateToken, async (req, res) => {
  try {
    let applications;

    if (req.user.role === 'STUDENT') {
      applications = await prisma.application.findMany({
        where: { studentId: req.user.userId },
        include: { scientist: true, payment: true, joining: true, certificate: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (req.user.role === 'SCIENTIST') {
      const scientist = await prisma.scientist.findUnique({
        where: { userId: req.user.userId },
      });

      applications = await prisma.application.findMany({
        where: scientist ? { scientistId: scientist.id } : {},
        include: { student: true, payment: true, joining: true, certificate: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      applications = await prisma.application.findMany({
        include: { student: true, scientist: true, payment: true, joining: true, certificate: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      type,
      fullName,
      email,
      phoneNo,
      collegeName,
      degreeName,
      year,
      fatherOrHusbandName,
      addressCorrespondence,
      addressPermanent,
      dob,
      placeOfBirth,
      gender,
      maritalStatus,
      nationality,
      category,
      durationMonths,
      topic,
      scientistId,
      autoAssignRequested,
      researchInterest,
      prizesAndAwards,
      specialTraining,
    } = req.body;

    const application = await prisma.application.create({
      data: {
        studentId: req.user.userId,
        type: type || 'INTERNSHIP',
        fullName: fullName || req.user.name,
        email: email || req.user.email,
        phoneNo,
        collegeName,
        degreeName,
        year,
        fatherOrHusbandName,
        addressCorrespondence,
        addressPermanent,
        dob: dob ? new Date(dob) : null,
        placeOfBirth,
        gender,
        maritalStatus,
        nationality,
        category,
        durationMonths: durationMonths ? parseInt(durationMonths) : 2,
        topic,
        scientistId: scientistId || null,
        autoAssignRequested: Boolean(autoAssignRequested),
        researchInterest,
        prizesAndAwards,
        specialTraining,
        status: 'PENDING_APPROVAL',
      },
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

module.exports = router;