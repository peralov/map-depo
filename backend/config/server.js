// backend/config/server.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key', // Use environment variable in production
  JWT_EXPIRES_IN: '24h'
};