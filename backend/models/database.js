// backend/models/database.js
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

const initializeDatabase = () => {
  // Create tables
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT UNIQUE,
      role TEXT DEFAULT 'public',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Organizations table
    db.run(`CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Landfill sites (Depos) table with all fields
    db.run(`CREATE TABLE IF NOT EXISTS depos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'medium',  -- clean, low, medium, high
      type TEXT DEFAULT 'garbage',   -- garbage, debris, landfill, etc.
      size TEXT DEFAULT 'medium',    -- small, medium, large with explanations
      reported_by INTEGER,
      vouch_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reported_by) REFERENCES users(id)
    )`);

    // Comments table for depos
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      depo_id INTEGER,
      user_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (depo_id) REFERENCES depos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Reports table
    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      depo_id INTEGER,
      reporter_id INTEGER,
      details TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (depo_id) REFERENCES depos(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    )`);

    // Cleanups table
    db.run(`CREATE TABLE IF NOT EXISTS cleanups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      depo_id INTEGER,
      organizer_id INTEGER,
      date DATETIME,
      details TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (depo_id) REFERENCES depos(id),
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )`);

    // Cleanup participants junction table
    db.run(`CREATE TABLE IF NOT EXISTS cleanup_participants (
      cleanup_id INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (cleanup_id, user_id),
      FOREIGN KEY (cleanup_id) REFERENCES cleanups(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Vouches table
    db.run(`CREATE TABLE IF NOT EXISTS vouches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      depo_id INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (depo_id) REFERENCES depos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Insert sample user
    const hashedPassword = bcrypt.hashSync('test123', 10);
    db.run(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`, 
      ['demo', hashedPassword, 'demo@example.com', 'public']);
    
    // Insert sample depos with new fields
    db.run(`INSERT INTO depos (name, description, latitude, longitude, status, type, size, reported_by, vouch_count) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Illegal Dump Site 1', 'Large trash site near forest', 41.9981, 21.4254, 'high', 'garbage', 'large', 1, 3]);
    
    db.run(`INSERT INTO depos (name, description, latitude, longitude, status, type, size, reported_by, vouch_count) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Construction Waste', 'Building materials dumped illegally', 42.0024, 21.3910, 'medium', 'construction', 'medium', 1, 1]);
    
    db.run(`INSERT INTO depos (name, description, latitude, longitude, status, type, size, reported_by, vouch_count) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Riverside Garbage', 'Plastic waste near the river', 41.9899, 21.4412, 'low', 'plastic', 'small', 1, 2]);
    
    db.run(`INSERT INTO depos (name, description, latitude, longitude, status, type, size, reported_by, vouch_count) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Electronic Waste Dump', 'Old computers and electronic devices', 41.9750, 21.4200, 'medium', 'electronic', 'medium', 1, 0]);
    
    db.run(`INSERT INTO depos (name, description, latitude, longitude, status, type, size, reported_by, vouch_count) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      ['Cleaned Area', 'Former waste site, now cleaned', 42.0100, 21.4000, 'clean', 'garbage', 'small', 1, 5]);
  });
};

module.exports = {
  initializeDatabase
};