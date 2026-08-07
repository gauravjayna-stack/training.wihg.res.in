const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get assigned students with progress tracking
exports.getAssignedStudents = async (req, res) => {
  try {
    const scientist = await prisma.scientistProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!scientist) return res.status(404).json({ error: 'Scientist profile not found.' });

    const students = await prisma.application.findMany({
      where: { scientistId: scientist.id },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        weeklyProgresses: { orderBy: { createdAt: 'desc' } },
        certificateApproval: true,
        reportUploads: true,
      },
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assigned students.' });
  }
};

// Update Weekly Progress
exports.updateWeeklyProgress = async (req, res) => {
  try {
    const { applicationId, weekNumber, statusLabel, remarks } = req.body;

    const progress = await prisma.weeklyProgress.create({
      data: {
        applicationId,
        weekNumber: parseInt(weekNumber),
        statusLabel,
        remarks,
        updatedBy: req.user.name || 'Scientist',
      },
    });

    res.json({ message: 'Weekly progress recorded.', progress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update weekly progress.' });
  }
};

// Scientist Upload Final Report PDF
exports.uploadProjectReport = async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'PDF file is required.' });

    const report = await prisma.reportUpload.create({
      data: {
        applicationId,
        filePath: req.file.path,
        uploadedBy: 'SCIENTIST',
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { reportPdfPath: req.file.path },
    });

    res.json({ message: 'Project report uploaded and archived.', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload project report.' });
  }
};

// Scientist Approval for Certificate
exports.approveForCertificate = async (req, res) => {
  try {
    const { applicationId } = req.body;

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: { include: { user: true } },
        scientist: { include: { user: true } },
      },
    });

    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const certNo = `WIHG/CERT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

    const approval = await prisma.certificateApproval.upsert({
      where: { applicationId },
      update: { status: 'PENDING_ADMIN' },
      create: {
        applicationId,
        certificateNo: certNo,
        studentName: app.student.user.name,
        scientistName: app.scientist ? app.scientist.user.name : 'N/A',
        university: app.student.university || 'N/A',
        college: app.student.college || 'N/A',
        course: app.student.course || 'N/A',
        topic: app.topic || 'N/A',
        duration: 'Standard Tenure',
        status: 'PENDING_ADMIN',
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'APPROVED_BY_SCIENTIST_FOR_CERT' },
    });

    res.json({ message: 'Certificate request forwarded to Admin.', approval });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve certificate.' });
  }
};

// Scientist Signature Management
exports.uploadSignature = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Signature file required.' });

    const scientist = await prisma.scientistProfile.update({
      where: { userId: req.user.id },
      data: { signaturePath: req.file.path },
    });

    res.json({ message: 'Signature updated successfully.', signaturePath: scientist.signaturePath });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload signature.' });
  }
};