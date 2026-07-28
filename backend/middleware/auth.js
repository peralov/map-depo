// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/server');
const { getUserById } = require('../models/user');

// Middleware to verify JWT
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(verified.id);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

module.exports = {
  verifyToken
};
