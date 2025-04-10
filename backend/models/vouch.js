// backend/models/vouch.js
const { db } = require('../config/database');

// Get vouches for a depo
const getVouchesForDepo = (depoId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT v.*, u.username 
       FROM vouches v
       JOIN users u ON v.user_id = u.id
       WHERE v.depo_id = ?
       ORDER BY v.created_at DESC`,
      [depoId],
      (err, vouches) => {
        if (err) {
          reject(err);
        } else {
          // Transform the results
          const transformedVouches = vouches.map(vouch => ({
            id: vouch.id,
            depo_id: vouch.depo_id,
            user: {
              id: vouch.user_id,
              username: vouch.username
            },
            created_at: vouch.created_at
          }));
          
          resolve(transformedVouches);
        }
      }
    );
  });
};

// Add a vouch
const addVouch = (depoId, userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO vouches (depo_id, user_id) VALUES (?, ?)',
      [depoId, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // Update vouch count in depos table
          db.run(
            'UPDATE depos SET vouch_count = vouch_count + 1 WHERE id = ?',
            [depoId],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // Get username for response
                db.get('SELECT username FROM users WHERE id = ?', [userId], (err, user) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({
                      id: this.lastID,
                      depo_id: depoId,
                      user: {
                        id: userId,
                        username: user.username
                      },
                      created_at: new Date().toISOString()
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

// Remove a vouch
const removeVouch = (depoId, userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM vouches WHERE depo_id = ? AND user_id = ?',
      [depoId, userId],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('User has not vouched for this depo'));
        } else {
          // Update vouch count in depos table
          db.run(
            'UPDATE depos SET vouch_count = MAX(0, vouch_count - 1) WHERE id = ?',
            [depoId],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ success: true });
              }
            }
          );
        }
      }
    );
  });
};

module.exports = {
  getVouchesForDepo,
  addVouch,
  removeVouch
};