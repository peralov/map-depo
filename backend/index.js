// backend/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database(':memory:'); // In-memory database for simplicity

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
  const hashedPassword = bcrypt.hashSync('password123', 10);
  db.run(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`, 
    ['demo_user', hashedPassword, 'demo@example.com', 'public']);
  
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

// Authentication routes
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, hashedPassword, email],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, userId: this.lastID, username });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, userId: user.id, username: user.username, role: user.role });
  });
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Depo routes
app.get('/api/depos', (req, res) => {
  db.all('SELECT * FROM depos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/depos/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM depos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    res.json(row);
  });
});

app.post('/api/depos', verifyToken, (req, res) => {
  const { name, description, latitude, longitude, size } = req.body;
  
  if (!name || !latitude || !longitude) {
    return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
  }

  db.run(
    'INSERT INTO depos (name, description, latitude, longitude, size, reported_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, latitude, longitude, size, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        name,
        description,
        latitude,
        longitude,
        size,
        reported_by: req.user.id
      });
    }
  );
});

// backend/index.js - Add these comment routes

// Get comments for a depo
app.get('/api/depos/:id/comments', (req, res) => {
  const depoId = req.params.id;
  
  db.all(
    `SELECT c.*, u.username as author_username 
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.depo_id = ?
     ORDER BY c.created_at DESC`,
    [depoId],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Transform the results for client
      const transformedComments = comments.map(comment => ({
        id: comment.id,
        depo_id: comment.depo_id,
        author: {
          id: comment.user_id,
          username: comment.author_username
        },
        content: comment.content,
        created_at: comment.created_at
      }));
      
      res.json(transformedComments);
    }
  );
});

// Add a comment to a depo
app.post('/api/depos/:id/comments', verifyToken, (req, res) => {
  const depoId = req.params.id;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  db.get('SELECT * FROM depos WHERE id = ?', [depoId], (err, depo) => {
    if (err || !depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    db.run(
      'INSERT INTO comments (depo_id, user_id, content) VALUES (?, ?, ?)',
      [depoId, req.user.id, content],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Get the username for the response
        db.get('SELECT username FROM users WHERE id = ?', [req.user.id], (err, user) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            id: this.lastID,
            depo_id: depoId,
            author: {
              id: req.user.id,
              username: user.username
            },
            content,
            created_at: new Date().toISOString()
          });
        });
      }
    );
  });
});

// Delete a comment
app.delete('/api/comments/:id', verifyToken, (req, res) => {
  const commentId = req.params.id;
  
  db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user is the author of the comment
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Comment deleted successfully' });
    });
  });
});

// Get reports for a depo (continued)
app.get('/api/depos/:id/reports', (req, res) => {
  const depoId = req.params.id;
  
  db.all(
    `SELECT r.*, u.username as reporter_username 
     FROM reports r
     JOIN users u ON r.reporter_id = u.id
     WHERE r.depo_id = ?
     ORDER BY r.created_at DESC`,
    [depoId],
    (err, reports) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Transform the results for client
      const transformedReports = reports.map(report => ({
        id: report.id,
        depo_id: report.depo_id,
        reporter: {
          id: report.reporter_id,
          username: report.reporter_username
        },
        details: report.details,
        status: report.status,
        created_at: report.created_at
      }));
      
      res.json(transformedReports);
    }
  );
});

// backend/index.js - Add these cleanup API endpoints

// Get all cleanups
app.get('/api/cleanups', (req, res) => {
  db.all(
    `SELECT c.*, d.name as depo_name, u.username as organizer_username 
     FROM cleanups c
     JOIN depos d ON c.depo_id = d.id
     JOIN users u ON c.organizer_id = u.id
     ORDER BY c.date ASC`,
    [],
    (err, cleanups) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Transform the results for client
      const transformedCleanups = cleanups.map(cleanup => ({
        id: cleanup.id,
        depo: {
          id: cleanup.depo_id,
          name: cleanup.depo_name
        },
        organizer: {
          id: cleanup.organizer_id,
          username: cleanup.organizer_username
        },
        date: cleanup.date,
        details: cleanup.details,
        status: cleanup.status,
        created_at: cleanup.created_at
      }));
      
      res.json(transformedCleanups);
    }
  );
});

// Get cleanups for a specific depo
app.get('/api/depos/:id/cleanups', (req, res) => {
  const depoId = req.params.id;
  
  db.all(
    `SELECT c.*, u.username as organizer_username 
     FROM cleanups c
     JOIN users u ON c.organizer_id = u.id
     WHERE c.depo_id = ?
     ORDER BY c.date ASC`,
    [depoId],
    (err, cleanups) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Transform the results for client
      const transformedCleanups = cleanups.map(cleanup => ({
        id: cleanup.id,
        depo_id: cleanup.depo_id,
        organizer: {
          id: cleanup.organizer_id,
          username: cleanup.organizer_username
        },
        date: cleanup.date,
        details: cleanup.details,
        status: cleanup.status,
        created_at: cleanup.created_at
      }));
      
      res.json(transformedCleanups);
    }
  );
});

// Get a specific cleanup by ID
app.get('/api/cleanups/:id', (req, res) => {
  const cleanupId = req.params.id;
  
  db.get(
    `SELECT c.*, d.name as depo_name, d.latitude, d.longitude, u.username as organizer_username 
     FROM cleanups c
     JOIN depos d ON c.depo_id = d.id
     JOIN users u ON c.organizer_id = u.id
     WHERE c.id = ?`,
    [cleanupId],
    (err, cleanup) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!cleanup) {
        return res.status(404).json({ error: 'Cleanup not found' });
      }
      
      // Get participants
      db.all(
        `SELECT u.id, u.username 
         FROM cleanup_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.cleanup_id = ?`,
        [cleanupId],
        (err, participants) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Transform the result
          const transformedCleanup = {
            id: cleanup.id,
            depo: {
              id: cleanup.depo_id,
              name: cleanup.depo_name,
              latitude: cleanup.latitude,
              longitude: cleanup.longitude
            },
            organizer: {
              id: cleanup.organizer_id,
              username: cleanup.organizer_username
            },
            date: cleanup.date,
            details: cleanup.details,
            status: cleanup.status,
            created_at: cleanup.created_at,
            participants: participants
          };
          
          res.json(transformedCleanup);
        }
      );
    }
  );
});

// Create a new cleanup
app.post('/api/depos/:id/cleanup', verifyToken, (req, res) => {
  const depoId = req.params.id;
  const { date, details } = req.body;
  
  if (!date) {
    return res.status(400).json({ error: 'Cleanup date is required' });
  }

  db.get('SELECT * FROM depos WHERE id = ?', [depoId], (err, depo) => {
    if (err || !depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    // Insert the cleanup
    db.run(
      'INSERT INTO cleanups (depo_id, organizer_id, date, details) VALUES (?, ?, ?, ?)',
      [depoId, req.user.id, date, details || ''],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const cleanupId = this.lastID;
        
        // Add organizer as first participant
        db.run(
          'INSERT INTO cleanup_participants (cleanup_id, user_id) VALUES (?, ?)',
          [cleanupId, req.user.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Get username for the response
            db.get('SELECT username FROM users WHERE id = ?', [req.user.id], (err, user) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              res.status(201).json({
                id: cleanupId,
                depo_id: depoId,
                organizer: {
                  id: req.user.id,
                  username: user.username
                },
                date,
                details: details || '',
                status: 'scheduled',
                created_at: new Date().toISOString(),
                participants: [{
                  id: req.user.id,
                  username: user.username
                }]
              });
            });
          }
        );
      }
    );
  });
});

// Update a cleanup
app.put('/api/cleanups/:id', verifyToken, (req, res) => {
  const cleanupId = req.params.id;
  const { date, details, status } = req.body;
  
  db.get('SELECT * FROM cleanups WHERE id = ?', [cleanupId], (err, cleanup) => {
    if (err || !cleanup) {
      return res.status(404).json({ error: 'Cleanup not found' });
    }
    
    // Check if user is the organizer
    if (cleanup.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this cleanup' });
    }
    
    // Build update query dynamically
    let updates = [];
    let params = [];
    
    if (date) {
      updates.push('date = ?');
      params.push(date);
    }
    
    if (details !== undefined) {
      updates.push('details = ?');
      params.push(details);
    }
    
    if (status) {
      // Validate status
      if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.push('status = ?');
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Add cleanup ID to params
    params.push(cleanupId);
    
    // Update the cleanup
    db.run(
      `UPDATE cleanups SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Get the updated cleanup
        db.get('SELECT * FROM cleanups WHERE id = ?', [cleanupId], (err, updatedCleanup) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json(updatedCleanup);
        });
      }
    );
  });
});

// Join a cleanup
app.post('/api/cleanups/:id/join', verifyToken, (req, res) => {
  const cleanupId = req.params.id;
  
  db.get('SELECT * FROM cleanups WHERE id = ?', [cleanupId], (err, cleanup) => {
    if (err || !cleanup) {
      return res.status(404).json({ error: 'Cleanup not found' });
    }
    
    // Check if cleanup is scheduled (can't join completed/cancelled cleanups)
    if (cleanup.status !== 'scheduled') {
      return res.status(400).json({ error: 'Cannot join a cleanup that is not scheduled' });
    }
    
    // Check if user is already a participant
    db.get(
      'SELECT * FROM cleanup_participants WHERE cleanup_id = ? AND user_id = ?',
      [cleanupId, req.user.id],
      (err, participant) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (participant) {
          return res.status(400).json({ error: 'User is already a participant in this cleanup' });
        }
        
        // Add user as participant
        db.run(
          'INSERT INTO cleanup_participants (cleanup_id, user_id) VALUES (?, ?)',
          [cleanupId, req.user.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Get all participants
            db.all(
              `SELECT u.id, u.username 
               FROM cleanup_participants cp
               JOIN users u ON cp.user_id = u.id
               WHERE cp.cleanup_id = ?`,
              [cleanupId],
              (err, participants) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                res.json({
                  cleanup_id: cleanupId,
                  participants: participants
                });
              }
            );
          }
        );
      }
    );
  });
});

// Leave a cleanup
app.delete('/api/cleanups/:id/join', verifyToken, (req, res) => {
  const cleanupId = req.params.id;
  
  db.get('SELECT * FROM cleanups WHERE id = ?', [cleanupId], (err, cleanup) => {
    if (err || !cleanup) {
      return res.status(404).json({ error: 'Cleanup not found' });
    }
    
    // Check if cleanup is scheduled (can't leave completed/cancelled cleanups)
    if (cleanup.status !== 'scheduled') {
      return res.status(400).json({ error: 'Cannot leave a cleanup that is not scheduled' });
    }
    
    // Check if user is the organizer (organizer can't leave)
    if (cleanup.organizer_id === req.user.id) {
      return res.status(400).json({ error: 'Organizer cannot leave the cleanup' });
    }
    
    // Remove user from participants
    db.run(
      'DELETE FROM cleanup_participants WHERE cleanup_id = ? AND user_id = ?',
      [cleanupId, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(400).json({ error: 'User is not a participant in this cleanup' });
        }
        
        res.json({ message: 'Successfully left the cleanup' });
      }
    );
  });
});

// Get upcoming cleanups
app.get('/api/cleanups/upcoming', (req, res) => {
  const today = new Date().toISOString();
  
  db.all(
    `SELECT c.*, d.name as depo_name, u.username as organizer_username 
     FROM cleanups c
     JOIN depos d ON c.depo_id = d.id
     JOIN users u ON c.organizer_id = u.id
     WHERE c.date > ? AND c.status = 'scheduled'
     ORDER BY c.date ASC
     LIMIT 10`,
    [today],
    (err, cleanups) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Transform the results for client
      const transformedCleanups = cleanups.map(cleanup => ({
        id: cleanup.id,
        depo: {
          id: cleanup.depo_id,
          name: cleanup.depo_name
        },
        organizer: {
          id: cleanup.organizer_id,
          username: cleanup.organizer_username
        },
        date: cleanup.date,
        details: cleanup.details,
        status: cleanup.status,
        created_at: cleanup.created_at
      }));
      
      res.json(transformedCleanups);
    }
  );
});

// Get vouches for a depo
app.get('/api/depos/:id/vouches', (req, res) => {
  const depoId = req.params.id;
  
  db.all(
    `SELECT v.*, u.username 
     FROM vouches v
     JOIN users u ON v.user_id = u.id
     WHERE v.depo_id = ?
     ORDER BY v.created_at DESC`,
    [depoId],
    (err, vouches) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Transform the results for client
      const transformedVouches = vouches.map(vouch => ({
        id: vouch.id,
        depo_id: vouch.depo_id,
        user: {
          id: vouch.user_id,
          username: vouch.username
        },
        created_at: vouch.created_at
      }));
      
      res.json(transformedVouches);
    }
  );
});

// Update a depo's status, type, or size
app.put('/api/depos/:id', verifyToken, (req, res) => {
  const depoId = req.params.id;
  const { name, description, status, type, size } = req.body;
  
  db.get('SELECT * FROM depos WHERE id = ?', [depoId], (err, depo) => {
    if (err || !depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    // Check if user is the creator or has admin role
    if (depo.reported_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this depo' });
    }
    
    // Build update query dynamically
    let updates = [];
    let params = [];
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (status) {
      // Validate status
      if (!['clean', 'low', 'medium', 'high'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.push('status = ?');
      params.push(status);
    }
    
    if (type) {
      // Validate type
      if (!['garbage', 'debris', 'landfill', 'electronic', 'hazardous', 'construction', 'organic', 'plastic', 'other'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type value' });
      }
      updates.push('type = ?');
      params.push(type);
    }
    
    if (size) {
      // Validate size
      if (!['small', 'medium', 'large'].includes(size)) {
        return res.status(400).json({ error: 'Invalid size value' });
      }
      updates.push('size = ?');
      params.push(size);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Add depoId to params
    params.push(depoId);
    
    // Update the depo
    db.run(
      `UPDATE depos SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Get the updated depo
        db.get('SELECT * FROM depos WHERE id = ?', [depoId], (err, updatedDepo) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json(updatedDepo);
        });
      }
    );
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});