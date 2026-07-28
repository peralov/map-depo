// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  getReports,
  getDepoReports,
  getUserReports,
  submitReport,
  changeReportStatus,
  removeReport
} = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

// Admin middleware for routes that require admin privileges
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin permission required.' });
  }
};

// Public routes
router.get(['/sites/:id/reports', '/depos/:id/reports'], getDepoReports);

// Routes that require authentication
router.get('/reports', verifyToken, isAdmin, getReports);
router.get('/reports/user', verifyToken, getUserReports);
router.post(['/sites/:id/reports', '/depos/:id/reports'], verifyToken, submitReport);
router.put('/reports/:id/status', verifyToken, isAdmin, changeReportStatus);
router.delete('/reports/:id', verifyToken, removeReport);

module.exports = router;
