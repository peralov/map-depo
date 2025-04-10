// backend/models/report.js
const { db } = require('../config/database');

// Get all reports
const getAllReports = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.*, u.username as reporter_username, d.name as depo_name 
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       JOIN depos d ON r.depo_id = d.id
       ORDER BY r.created_at DESC`,
      [],
      (err, reports) => {
        if (err) {
          reject(err);
        } else {
          // Transform the results for client
          const transformedReports = reports.map(report => ({
            id: report.id,
            depo: {
              id: report.depo_id,
              name: report.depo_name
            },
            reporter: {
              id: report.reporter_id,
              username: report.reporter_username
            },
            details: report.details,
            status: report.status,
            created_at: report.created_at
          }));
          
          resolve(transformedReports);
        }
      }
    );
  });
};

// Get reports for a depo
const getReportsForDepo = (depoId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.*, u.username as reporter_username 
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       WHERE r.depo_id = ?
       ORDER BY r.created_at DESC`,
      [depoId],
      (err, reports) => {
        if (err) {
          reject(err);
        } else {
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
          
          resolve(transformedReports);
        }
      }
    );
  });
};

// Get reports by user
const getReportsByUser = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.*, d.name as depo_name 
       FROM reports r
       JOIN depos d ON r.depo_id = d.id
       WHERE r.reporter_id = ?
       ORDER BY r.created_at DESC`,
      [userId],
      (err, reports) => {
        if (err) {
          reject(err);
        } else {
          // Transform the results for client
          const transformedReports = reports.map(report => ({
            id: report.id,
            depo: {
              id: report.depo_id,
              name: report.depo_name
            },
            details: report.details,
            status: report.status,
            created_at: report.created_at
          }));
          
          resolve(transformedReports);
        }
      }
    );
  });
};

// Add a report
const addReport = (depoId, reporterId, details) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO reports (depo_id, reporter_id, details) VALUES (?, ?, ?)',
      [depoId, reporterId, details],
      function(err) {
        if (err) {
          reject(err);
        } else {
          const reportId = this.lastID;
          
          // Get username for the response
          db.get('SELECT username FROM users WHERE id = ?', [reporterId], (err, user) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: reportId,
                depo_id: depoId,
                reporter: {
                  id: reporterId,
                  username: user.username
                },
                details,
                status: 'pending',
                created_at: new Date().toISOString()
              });
            }
          });
        }
      }
    );
  });
};

// Get report by ID
const getReportById = (reportId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM reports WHERE id = ?', [reportId], (err, report) => {
      if (err) {
        reject(err);
      } else {
        resolve(report);
      }
    });
  });
};

// Update report status
const updateReportStatus = (reportId, status) => {
  return new Promise((resolve, reject) => {
    if (!['pending', 'resolved', 'rejected'].includes(status)) {
      reject(new Error('Invalid status value'));
      return;
    }
    
    db.run(
      'UPDATE reports SET status = ? WHERE id = ?',
      [status, reportId],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Report not found'));
        } else {
          // Get the updated report
          db.get(
            `SELECT r.*, u.username as reporter_username, d.name as depo_name 
             FROM reports r
             JOIN users u ON r.reporter_id = u.id
             JOIN depos d ON r.depo_id = d.id
             WHERE r.id = ?`,
            [reportId],
            (err, report) => {
              if (err) {
                reject(err);
              } else if (!report) {
                reject(new Error('Report not found'));
              } else {
                // Transform for client
                const transformedReport = {
                  id: report.id,
                  depo: {
                    id: report.depo_id,
                    name: report.depo_name
                  },
                  reporter: {
                    id: report.reporter_id,
                    username: report.reporter_username
                  },
                  details: report.details,
                  status: report.status,
                  created_at: report.created_at
                };
                
                resolve(transformedReport);
              }
            }
          );
        }
      }
    );
  });
};

// Delete report
const deleteReport = (reportId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM reports WHERE id = ?', [reportId], function(err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Report not found'));
      } else {
        resolve({ success: true });
      }
    });
  });
};

module.exports = {
  getAllReports,
  getReportsForDepo,
  getReportsByUser,
  addReport,
  getReportById,
  updateReportStatus,
  deleteReport
};
