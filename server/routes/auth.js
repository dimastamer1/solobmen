const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Улучшенная регистрация с CORS заголовками
router.post('/register', async (req, res) => {
  try {
    console.log('Регистрация:', req.body);
    
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

    // Создание пользователя с депозитным адресом
    const newUser = new User({ 
      username, 
      password: hashedPassword,
      solBalance: 0.5,  // Бонус за регистрацию
      usdtBalance: 10,  // Бонус за регистрацию
      depositAddress: `SOL-${Math.random().toString(36).substring(2, 15)}`
    });

    await newUser.save();
    
    // Устанавливаем CORS заголовки
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.json({ 
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        solBalance: newUser.solBalance,
        usdtBalance: newUser.usdtBalance,
        depositAddress: newUser.depositAddress
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

// Улучшенный вход с сессией
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Сохраняем пользователя в сессии
    req.session.user = {
      id: user._id,
      username: user.username
    };

    // Устанавливаем CORS заголовки
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
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

// Выход с очисткой сессии
router.get('/logout', (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) throw err;
      
      // Устанавливаем CORS заголовки
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({ 
      success: false,
      message: 'Logout failed' 
    });
  }
});

module.exports = router;