
// backend/models/depo.js
const { db } = require('../config/database');

// Get all depos
const getAllDepos = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM depos', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get depo by id
const getDepoById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM depos WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Create new depo
const createDepo = (name, description, latitude, longitude, size, userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO depos (name, description, latitude, longitude, size, reported_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, latitude, longitude, size, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            name,
            description,
            latitude,
            longitude,
            size,
            reported_by: userId
          });
        }
      }
    );
  });
};

// Update depo
const updateDepo = (id, updates) => {
  return new Promise((resolve, reject) => {
    // Build update query dynamically
    const fieldsToUpdate = Object.keys(updates);
    const updateValues = Object.values(updates);
    
    if (fieldsToUpdate.length === 0) {
      reject(new Error('No valid fields to update'));
      return;
    }
    
    const updateClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE depos SET ${updateClause} WHERE id = ?`;
    
    // Add ID to values
    updateValues.push(id);
    
    db.run(query, updateValues, function(err) {
      if (err) {
        reject(err);
      } else {
        getDepoById(id)
          .then(depo => resolve(depo))
          .catch(err => reject(err));
      }
    });
  });
};

module.exports = {
  getAllDepos,
  getDepoById,
  createDepo,
  updateDepo
};