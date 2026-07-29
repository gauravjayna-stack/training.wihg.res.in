require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const scientistRoutes = require('./routes/scientists');
const applicationRoutes = require('./routes/applications');
const paymentRoutes = require('./routes/payments');
const joiningRoutes = require('./routes/joining');
const certificateRoutes = require('./routes/certificates');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('trust proxy', 1); // behind Nginx
app.use(helmet({ crossOriginResourcePolicy: false })); // allow /uploads to be fetched cross-origin by the SPA
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Global rate limiting; login/register get a stricter limit below.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts. Please try again later.' } });

// Static file serving for uploaded receipts, reports, and generated certificates.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'wihg-server' }));

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/scientists', scientistRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/joining', joiningRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);

// Public QR-verification page also lives under /api/certificates/verify/:certNo
// but is mirrored here at the top level to match the spec's `/verify/:certificate_id`.
app.get('/verify/:certNo', (req, res) => res.redirect(`/api/certificates/verify/${encodeURIComponent(req.params.certNo)}`));

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Central error handler — catches multer errors, Prisma errors, etc.,
// and never leaks stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message && err.message.includes('Only PDF, JPG, PNG')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`WIHG server listening on port ${PORT}`));
