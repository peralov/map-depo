// backend/config/database.js
const sqlite3 = require('sqlite3').verbose();

// In-memory database for simplicity
// In production, use a persistent database
const db = new sqlite3.Database(':memory:');

module.exports = {
  db
};