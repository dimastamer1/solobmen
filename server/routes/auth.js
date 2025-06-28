const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Улучшенная регистрация
router.post('/register', async (req, res) => {
  try {
    console.log('Регистрация:', req.body); // Логируем входящие данные
    
    const { username, password } = req.body;
    
    // Валидация
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    // Проверка существующего пользователя
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists' 
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создание пользователя
    const newUser = new User({ 
      username, 
      password: hashedPassword,
      solBalance: 0.5,
      usdtBalance: 10,
      depositAddress: `SOL-${Math.random().toString(36).substring(2, 15)}`
    });

    await newUser.save();
    
    // Ответ без чувствительных данных
    res.json({ 
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        solBalance: newUser.solBalance,
        usdtBalance: newUser.usdtBalance
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Улучшенный вход
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Находим пользователя
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Формируем ответ
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        solBalance: user.solBalance,
        usdtBalance: user.usdtBalance,
        depositAddress: user.depositAddress
      }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Выход
router.get('/logout', (req, res) => {
  try {
    req.session.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({ 
      success: false,
      message: 'Logout failed' 
    });
  }
});

module.exports = router;