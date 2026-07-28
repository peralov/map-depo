// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const depoRoutes = require('./routes/depoRoutes');
const commentRoutes = require('./routes/commentRoutes');
const cleanupRoutes = require('./routes/cleanupRoutes');
const vouchRoutes = require('./routes/vouchRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import database initialization
const { initializeDatabase } = require('./models/database');

// Server config
const { CORS_ORIGIN, PORT } = require('./config/server');

const app = express();

// Middleware
const allowedOrigins = CORS_ORIGIN === '*'
  ? '*'
  : CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'open-waste-map-api'
  });
});

// Routes
app.use('/api', authRoutes);
app.use('/api', depoRoutes);
app.use('/api', commentRoutes);
app.use('/api', cleanupRoutes);
app.use('/api', vouchRoutes);
app.use('/api', reportRoutes);

const start = async () => {
  await initializeDatabase();

  return app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  start
};
