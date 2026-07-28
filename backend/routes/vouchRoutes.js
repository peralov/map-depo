
// backend/routes/vouchRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDepoVouches,
  createVouch,
  deleteVouch
} = require('../controllers/vouchController');
const { verifyToken } = require('../middleware/auth');

// Vouch routes
router.get(['/sites/:id/vouches', '/depos/:id/vouches'], getDepoVouches);
router.post(['/sites/:id/vouches', '/depos/:id/vouch'], verifyToken, createVouch);
router.delete(['/sites/:id/vouches', '/depos/:id/vouch'], verifyToken, deleteVouch);

module.exports = router;
