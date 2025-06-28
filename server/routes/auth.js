const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Создание нового пользователя с бонусом
    const newUser = new User({ 
      username, 
      password,
      solBalance: 0.5, // Бонус за регистрацию 0.5 SOL
      usdtBalance: 10  // Бонус 10 USDT
    });

    await newUser.save();
    
    // Сохраняем пользователя в сессии
    req.session.user = {
      id: newUser._id,
      username: newUser.username,
      solBalance: newUser.solBalance,
      usdtBalance: newUser.usdtBalance,
      depositAddress: newUser.depositAddress
    };

    res.json({ 
      success: true,
      user: req.session.user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Обновляем балансы из базы
    const updatedUser = await User.findById(user._id);
    
    req.session.user = {
      id: updatedUser._id,
      username: updatedUser.username,
      solBalance: updatedUser.solBalance,
      usdtBalance: updatedUser.usdtBalance,
      depositAddress: updatedUser.depositAddress
    };

    res.json({ 
      success: true,
      user: req.session.user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Выход
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;