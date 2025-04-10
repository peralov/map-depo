// backend/routes/cleanupRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCleanups,
  getDepoCleanups,
  getCleanup,
  addCleanup,
  editCleanup,
  participateInCleanup,
  withdrawFromCleanup,
  getNext
} = require('../controllers/cleanupController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/cleanups', getCleanups);
router.get('/cleanups/upcoming', getNext);
router.get('/cleanups/:id', getCleanup);
router.get('/depos/:id/cleanups', getDepoCleanups);

// Protected routes
router.post('/depos/:id/cleanup', verifyToken, addCleanup);
router.put('/cleanups/:id', verifyToken, editCleanup);
router.post('/cleanups/:id/join', verifyToken, participateInCleanup);
router.delete('/cleanups/:id/join', verifyToken, withdrawFromCleanup);

module.exports = router;
