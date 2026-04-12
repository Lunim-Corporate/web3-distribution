const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { initializeListener } = require('./lib/contractListener');
const projectsRouter = require('./routes/projects');
const transactionsRouter = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for local development ease
}));
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/transactions', transactionsRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Moonstone API Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Moonstone Backend Running on http://localhost:${PORT}`);
  console.log(`🔗 Tracking Frontend: ${FRONTEND_URL}\n`);
  
  // Initialize blockchain event listener
  initializeListener();
});
