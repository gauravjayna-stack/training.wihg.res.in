const express = require('express');
const prisma = require('../utils/prisma'); // Adjust path if needed

const router = express.Router();

// 1. GET /api/admin/settings - Retrieve saved Coordinator & Director names
router.get('/settings', async (req, res) => {
  try {
    let settings = null;
    if (prisma.systemSettings) {
      settings = await prisma.systemSettings.findFirst();
    }

    if (!settings) {
      settings = {
        coordinatorName: '',
        coordinatorDesignation: '',
        directorName: '',
        directorDesignation: '',
      };
    }

    return res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.json({
      coordinatorName: '',
      coordinatorDesignation: '',
      directorName: '',
      directorDesignation: '',
    });
  }
});

// 2. PUT /api/admin/settings - Save Coordinator & Director names when you click "Save Signatories"
router.put('/settings', async (req, res) => {
  try {
    const { coordinatorName, coordinatorDesignation, directorName, directorDesignation } = req.body || {};

    if (prisma.systemSettings) {
      const existing = await prisma.systemSettings.findFirst();
      if (existing) {
        await prisma.systemSettings.update({
          where: { id: existing.id },
          data: { coordinatorName, coordinatorDesignation, directorName, directorDesignation },
        });
      } else {
        await prisma.systemSettings.create({
          data: { coordinatorName, coordinatorDesignation, directorName, directorDesignation },
        });
      }
    }

    return res.json({
      message: 'Signatories saved successfully!',
      settings: { coordinatorName, coordinatorDesignation, directorName, directorDesignation },
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return res.status(500).json({ error: 'Failed to save signatories.' });
  }
});

module.exports = router;