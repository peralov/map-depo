
// backend/routes/depoRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getDepos, 
  getDepo, 
  addDepo, 
  editDepo 
} = require('../controllers/depoController');
const { verifyToken } = require('../middleware/auth');

// Canonical site routes with backwards-compatible /depos aliases.
router.get(['/sites', '/depos'], getDepos);
router.get(['/sites/:id', '/depos/:id'], getDepo);
router.post(['/sites', '/depos'], verifyToken, addDepo);
router.put(['/sites/:id', '/depos/:id'], verifyToken, editDepo);

module.exports = router;
