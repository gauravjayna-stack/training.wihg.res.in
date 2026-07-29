const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const DIRS = ['receipts', 'reports', 'joining', 'certificates', 'waivers'];
for (const d of DIRS) {
  const p = path.join(UPLOAD_ROOT, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function makeUploader(subdir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, subdir)),
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, safeName);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new Error('Only PDF, JPG, PNG, or WEBP files are allowed.'));
      }
      cb(null, true);
    },
  });
}

module.exports = { makeUploader, UPLOAD_ROOT };
