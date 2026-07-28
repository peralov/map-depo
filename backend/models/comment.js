// backend/models/comment.js
const { db } = require('../config/database');

// Get comments for a depo
const getCommentsForDepo = (depoId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, u.username as author_username 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.depo_id = ?
       ORDER BY c.created_at DESC`,
      [depoId],
      (err, comments) => {
        if (err) {
          reject(err);
        } else {
          // Transform the results for client
          const transformedComments = comments.map(comment => ({
            id: comment.id,
            depoId: comment.depo_id,
            author: {
              id: comment.user_id,
              username: comment.author_username
            },
            content: comment.content,
            createdAt: comment.created_at
          }));
          
          resolve(transformedComments);
        }
      }
    );
  });
};

// Add a comment
const addComment = (depoId, userId, content) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO comments (depo_id, user_id, content) VALUES (?, ?, ?)',
      [depoId, userId, content],
      function(err) {
        if (err) {
          reject(err);
        } else {
          const commentId = this.lastID;
          
          // Get username for the response
          db.get('SELECT username FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: commentId,
                depoId,
                author: {
                  id: userId,
                  username: user.username
                },
                content,
                createdAt: new Date().toISOString()
              });
            }
          });
        }
      }
    );
  });
};

// Get comment by ID
const getCommentById = (commentId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
      if (err) {
        reject(err);
      } else {
        resolve(comment);
      }
    });
  });
};

// Delete comment
const deleteComment = (commentId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ success: true, changes: this.changes });
      }
    });
  });
};

module.exports = {
  getCommentsForDepo,
  addComment,
  getCommentById,
  deleteComment
};
