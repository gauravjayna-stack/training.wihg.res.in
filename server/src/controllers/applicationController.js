const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Centralized Auto-Prefill Data Retrieval by Application ID or User ID
exports.getStudentContext = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true } },
        applications: {
          orderBy: { createdAt: 'desc' },
          include: {
            scientist: { include: { user: { select: { name: true, email: true } } } },
            weeklyProgresses: { orderBy: { weekNumber: 'asc' } },
            certificateApproval: true,
            reportUploads: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const activeApp = student.applications.find(a => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(a.status)) || student.applications[0] || null;

    return res.json({
      profile: {
        name: student.user.name,
        email: student.user.email,
        phone: student.phone,
        university: student.university,
        college: student.college,
        course: student.course,
        discipline: student.discipline,
      },
      activeApplication: activeApp,
      hasActiveApplication: !!activeApp && !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(activeApp.status),
    });
  } catch (error) {
    console.error('Error in getStudentContext:', error);
    res.status(500).json({ error: 'Server error retrieving student context.' });
  }
};

// Certificate Request Submission
exports.submitCertificateRequest = async (req, res) => {
  try {
    const { applicationId, reportAbstract, feedback } = req.body;
    const reportPdfPath = req.file ? req.file.path : null;

    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        reportAbstract,
        feedback,
        ...(reportPdfPath && { reportPdfPath }),
        status: 'CERTIFICATE_REQUESTED',
      },
    });

    if (reportPdfPath) {
      await prisma.reportUpload.create({
        data: {
          applicationId,
          filePath: reportPdfPath,
          uploadedBy: 'STUDENT',
        },
      });
    }

    res.json({ message: 'Certificate request submitted successfully.', application: updated });
  } catch (err) {
    console.error('Certificate Request Error:', err);
    res.status(500).json({ error: 'Failed to submit certificate request.' });
  }
};