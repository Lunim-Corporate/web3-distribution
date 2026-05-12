/**
 * LUNIM Express Backend — PRD §4.4 middleware stack, §12 route registry
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { initializeContractListener } = require('./lib/contractListener');
const verifyJWT = require('./middleware/verifyJWT');
const { generalLimiter, authLimiter } = require('./middleware/rateLimit');

// Route imports
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const transactionsRouter = require('./routes/transactions');
const holdersRouter = require('./routes/holders');
const analyticsRouter = require('./routes/analytics');
const settingsRouter = require('./routes/settings');
const invitesRouter = require('./routes/invites');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Security Middleware Stack (PRD §4.4) ────────────────────────
app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(generalLimiter);

// ─── Health Check (no auth required) ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Auth Routes (rate-limited, no JWT required) ─────────────────
app.use('/api/auth', authLimiter, authRouter);

// ─── Protected Routes (JWT required) ─────────────────────────────
app.use('/api/projects', verifyJWT, projectsRouter);
app.use('/api/transactions', verifyJWT, transactionsRouter);
app.use('/api/holders', verifyJWT, holdersRouter);
app.use('/api/analytics', analyticsRouter);  // has own verifyJWT per route
app.use('/api/settings', settingsRouter);    // has own verifyJWT per route
app.use('/api/invites', invitesRouter);      // has own verifyJWT per route

// ─── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error handler (no stack traces in production) ───────────────
app.use((err, req, res, _next) => {
  console.error('[server error]', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(500).json({ error: message });
});

// ─── Start ───────────────────────────────────────────────────────
initializeContractListener().catch(console.error);

const server = app.listen(PORT, () => {
  console.log(`🚀 LUNIM Backend running on port ${PORT}`);
  console.log(`   Frontend URL: ${FRONTEND_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown — PRD §20.5
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
