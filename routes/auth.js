const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get the users collection directly
const User = mongoose.connection.collection('users');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    // Find user with matching username and password
    const user = await User.findOne({
      username: username,
      password: password  // Plain text comparison
    });

    if (!user) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    console.log('User found:', user);

    // User found - return success with role
    res.json({
      username: user.username,
      role: user.admin ? 'admin' : 'user'  // Convert boolean admin field to role string
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登入失敗' });
  }
});

module.exports = router;