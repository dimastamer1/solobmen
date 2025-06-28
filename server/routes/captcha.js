const express = require('express');
const router = express.Router();
const CaptchaPass = require('../models/CaptchaPass');

// Проверка капчи
router.post('/verify', async (req, res) => {
  try {
    const { answer } = req.body;
    
    // Простая проверка капчи
    if (answer !== "12") {
      return res.status(400).json({ 
        success: false,
        message: 'Wrong answer' 
      });
    }

    // Сохраняем факт прохождения капчи
    const pass = new CaptchaPass({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });

    await pass.save();
    
    res.json({ 
      success: true,
      message: 'Captcha passed'
    });

  } catch (error) {
    console.error('Captcha error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error'
    });
  }
});

// Получить статистику по прохождениям
router.get('/stats', async (req, res) => {
  try {
    const totalPasses = await CaptchaPass.countDocuments();
    res.json({
      success: true,
      totalPasses
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;