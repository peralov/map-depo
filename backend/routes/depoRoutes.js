
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

// Depo routes
router.get('/depos', getDepos);
router.get('/depos/:id', getDepo);
router.post('/depos', verifyToken, addDepo);
router.put('/depos/:id', verifyToken, editDepo);

module.exports = router;
