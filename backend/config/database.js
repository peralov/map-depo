// backend/config/database.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'data', 'map-depo.sqlite');

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath);
db.run('PRAGMA foreign_keys = ON');

module.exports = {
  db,
  dbPath
};
