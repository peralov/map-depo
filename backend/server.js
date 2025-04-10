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
const { PORT } = require('./config/server');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// Routes
app.use('/api', authRoutes);
app.use('/api', depoRoutes);
app.use('/api', commentRoutes);
app.use('/api', cleanupRoutes);
app.use('/api', vouchRoutes);
app.use('/api', reportRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});