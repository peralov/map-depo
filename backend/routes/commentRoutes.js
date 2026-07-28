

// backend/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDepoComments,
  createComment,
  removeComment
} = require('../controllers/commentController');
const { verifyToken } = require('../middleware/auth');

// Comment routes
router.get(['/sites/:id/comments', '/depos/:id/comments'], getDepoComments);
router.post(['/sites/:id/comments', '/depos/:id/comments'], verifyToken, createComment);
router.delete('/comments/:id', verifyToken, removeComment);

module.exports = router;
