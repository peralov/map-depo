
// backend/models/depo.js
const { db } = require('../config/database');

const serializeDepo = (depo) => {
  if (!depo) return null;

  return {
    id: depo.id,
    name: depo.name,
    description: depo.description,
    latitude: depo.latitude,
    longitude: depo.longitude,
    status: depo.status,
    type: depo.type,
    size: depo.size,
    reportedBy: depo.reported_by
      ? {
          id: depo.reported_by,
          username: depo.reported_by_username || null
        }
      : null,
    vouchCount: depo.vouch_count,
    createdAt: depo.created_at
  };
};

// Get all depos
const getAllDepos = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT d.*, u.username as reported_by_username
       FROM depos d
       LEFT JOIN users u ON d.reported_by = u.id`,
      [],
      (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(serializeDepo));
      }
    });
  });
};

// Get depo by id
const getDepoById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT d.*, u.username as reported_by_username
       FROM depos d
       LEFT JOIN users u ON d.reported_by = u.id
       WHERE d.id = ?`,
      [id],
      (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(serializeDepo(row));
      }
    });
  });
};

// Create new depo
const createDepo = ({
  name,
  description,
  latitude,
  longitude,
  status,
  type,
  size,
  userId
}) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO depos (name, description, latitude, longitude, status, type, size, reported_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, latitude, longitude, status, type, size, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          getDepoById(this.lastID)
            .then(depo => resolve(depo))
            .catch(err => reject(err));
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
