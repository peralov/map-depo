// backend/controllers/commentController.js
const {
  getCommentsForDepo,
  addComment,
  getCommentById,
  deleteComment
} = require('../models/comment');
const { getDepoById } = require('../models/depo');

// Get comments for a depo
const getDepoComments = async (req, res) => {
  try {
    const depoId = req.params.id;
    const comments = await getCommentsForDepo(depoId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a comment to a depo
const createComment = async (req, res) => {
  try {
    const depoId = req.params.id;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Check if depo exists
    const depo = await getDepoById(depoId);
    if (!depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    const comment = await addComment(depoId, req.user.id, content);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a comment
const removeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    
    // Check if comment exists
    const comment = await getCommentById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user is the author of the comment
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    await deleteComment(commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDepoComments,
  createComment,
  removeComment
};