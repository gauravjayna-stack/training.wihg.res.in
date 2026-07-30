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

app.set('trust proxy', 1); // Behind Render/Nginx reverse proxy

app.use(helmet({ crossOriginResourcePolicy: false }));

// Updated CORS settings to ensure preflight OPTIONS requests pass through cleanly
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://training-wihg-res-in.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '2mb' }));

// Global rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 30, 
  message: { error: 'Too many attempts. Please try again later.' } 
});

// Static file serving for uploaded receipts, reports, and generated certificates
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health & root checks
app.get('/', (req, res) => res.json({ ok: true, message: 'WIHG Server API is running' }));
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'wihg-server' }));

// Auth Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

// App Domain Routes
app.use('/api/scientists', scientistRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/joining', joiningRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);

// Public verification redirect
app.get('/verify/:certNo', (req, res) => res.redirect(`/api/certificates/verify/${encodeURIComponent(req.params.certNo)}`));

// 404 Handler for unmatched endpoints
app.use((req, res) => res.status(404).json({ error: `Cannot ${req.method} ${req.url}` }));

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  if (err.message && err.message.includes('Only PDF, JPG, PNG')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`WIHG server listening on port ${PORT}`));