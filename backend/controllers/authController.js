// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/server');
const { getUserByUsername, createUser } = require('../models/user');

const buildAuthResponse = (user) => {
  const userPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: userPayload };
};

// Register a new user
const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newUser = await createUser(username, password, email);
    res.json(buildAuthResponse(newUser));
  } catch (error) {
    res.status(400).json({ error: 'Username or email already exists' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await getUserByUsername(username);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login
};
