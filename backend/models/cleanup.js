// backend/models/cleanup.js
const { db } = require('../config/database');

// Get all cleanups
const getAllCleanups = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, d.name as depo_name, u.username as organizer_username 
       FROM cleanups c
       JOIN depos d ON c.depo_id = d.id
       JOIN users u ON c.organizer_id = u.id
       ORDER BY c.date ASC`,
      [],
      (err, cleanups) => {
        if (err) {
          reject(err);
        } else {
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
            createdAt: cleanup.created_at
          }));
          
          resolve(transformedCleanups);
        }
      }
    );
  });
};

// Get cleanups for a depo
const getCleanupsForDepo = (depoId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, u.username as organizer_username 
       FROM cleanups c
       JOIN users u ON c.organizer_id = u.id
       WHERE c.depo_id = ?
       ORDER BY c.date ASC`,
      [depoId],
      (err, cleanups) => {
        if (err) {
          reject(err);
        } else {
          // Transform the results
          const transformedCleanups = cleanups.map(cleanup => ({
            id: cleanup.id,
            depoId: cleanup.depo_id,
            organizer: {
              id: cleanup.organizer_id,
              username: cleanup.organizer_username
            },
            date: cleanup.date,
            details: cleanup.details,
            status: cleanup.status,
            createdAt: cleanup.created_at
          }));
          
          resolve(transformedCleanups);
        }
      }
    );
  });
};

// Get cleanup by ID with participants
const getCleanupById = (cleanupId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT c.*, d.name as depo_name, d.latitude, d.longitude, u.username as organizer_username 
       FROM cleanups c
       JOIN depos d ON c.depo_id = d.id
       JOIN users u ON c.organizer_id = u.id
       WHERE c.id = ?`,
      [cleanupId],
      (err, cleanup) => {
        if (err) {
          reject(err);
        } else if (!cleanup) {
          resolve(null);
        } else {
          // Get participants
          db.all(
            `SELECT u.id, u.username 
             FROM cleanup_participants cp
             JOIN users u ON cp.user_id = u.id
             WHERE cp.cleanup_id = ?`,
            [cleanupId],
            (err, participants) => {
              if (err) {
                reject(err);
              } else {
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
                  createdAt: cleanup.created_at,
                  participants: participants
                };
                
                resolve(transformedCleanup);
              }
            }
          );
        }
      }
    );
  });
};

// Create cleanup
const createCleanup = (depoId, organizerId, date, details) => {
  return new Promise((resolve, reject) => {
    // Insert the cleanup
    db.run(
      'INSERT INTO cleanups (depo_id, organizer_id, date, details) VALUES (?, ?, ?, ?)',
      [depoId, organizerId, date, details || ''],
      function(err) {
        if (err) {
          reject(err);
        } else {
          const cleanupId = this.lastID;
          
          // Add organizer as first participant
          db.run(
            'INSERT INTO cleanup_participants (cleanup_id, user_id) VALUES (?, ?)',
            [cleanupId, organizerId],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // Get username for the response
                db.get('SELECT username FROM users WHERE id = ?', [organizerId], (err, user) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({
                      id: cleanupId,
                      depoId,
                      organizer: {
                        id: organizerId,
                        username: user.username
                      },
                      date,
                      details: details || '',
                      status: 'scheduled',
                      createdAt: new Date().toISOString(),
                      participants: [{
                        id: organizerId,
                        username: user.username
                      }]
                    });
                  }
                });
              }
            }
          );
        }
      }
    );
  });
};

// Update cleanup
const updateCleanup = (cleanupId, updates) => {
  return new Promise((resolve, reject) => {
    // Build update query dynamically
    const fields = Object.keys(updates);
    const values = fields.map(field => updates[field]);
    
    if (fields.length === 0) {
      reject(new Error('No valid fields to update'));
      return;
    }
    
    const updateClause = fields.map(field => `${field} = ?`).join(', ');
    
    // Add ID to values
    values.push(cleanupId);
    
    // Update the cleanup
    db.run(
      `UPDATE cleanups SET ${updateClause} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          reject(err);
        } else {
          getCleanupById(cleanupId)
            .then(cleanup => resolve(cleanup))
            .catch(err => reject(err));
        }
      }
    );
  });
};

// Join cleanup
const joinCleanup = (cleanupId, userId) => {
  return new Promise((resolve, reject) => {
    // First check if user is already a participant
    db.get(
      'SELECT * FROM cleanup_participants WHERE cleanup_id = ? AND user_id = ?',
      [cleanupId, userId],
      (err, participant) => {
        if (err) {
          return reject(err);
        }
        
        if (participant) {
          return reject(new Error('User is already a participant in this cleanup'));
        }
        
        // Add user as participant
        db.run(
          'INSERT INTO cleanup_participants (cleanup_id, user_id) VALUES (?, ?)',
          [cleanupId, userId],
          function(err) {
            if (err) {
              return reject(err);
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
                  return reject(err);
                }
                
                resolve({
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
};

// Leave cleanup
const leaveCleanup = (cleanupId, userId) => {
  return new Promise((resolve, reject) => {
    // Check if user is a participant
    db.get(
      'SELECT * FROM cleanup_participants WHERE cleanup_id = ? AND user_id = ?',
      [cleanupId, userId],
      (err, participant) => {
        if (err) {
          return reject(err);
        }
        
        if (!participant) {
          return reject(new Error('User is not a participant in this cleanup'));
        }
        
        // Remove user from participants
        db.run(
          'DELETE FROM cleanup_participants WHERE cleanup_id = ? AND user_id = ?',
          [cleanupId, userId],
          function(err) {
            if (err) {
              return reject(err);
            }
            
            resolve({ success: true });
          }
        );
      }
    );
  });
};

// Get upcoming cleanups
const getUpcomingCleanups = () => {
  return new Promise((resolve, reject) => {
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
          reject(err);
        } else {
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
            createdAt: cleanup.created_at
          }));
          
          resolve(transformedCleanups);
        }
      }
    );
  });
};

module.exports = {
  getAllCleanups,
  getCleanupsForDepo,
  getCleanupById,
  createCleanup,
  updateCleanup,
  joinCleanup,
  leaveCleanup,
  getUpcomingCleanups
};
