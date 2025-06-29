require('dotenv').config();
require('./bot'); // Импорт бота
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://solobmen.onrender.com',
    'https://telegram.org' // Для WebApp
  ],
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Middleware для проверки Telegram WebApp
app.use('/api', (req, res, next) => {
  if (req.headers['telegram-webapp-init-data']) {
    // Здесь можно добавить проверку данных Telegram
  }
  next();
});

// Маршруты
app.use('/api/captcha', require('./routes/captcha'));

// WebApp маршрут
app.get('/webapp', async (req, res) => {
  try {
    const initData = req.query.initData;
    // Проверка данных Telegram WebApp и аутентификация
    
    const user = await User.findOne({ telegramId: /* из данных */ });
    if (!user) return res.status(403).send('Access denied');
    
    res.render('webapp', { 
      user,
      apiBaseUrl: process.env.API_BASE_URL 
    });
  } catch (error) {
    console.error('WebApp error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { 
    apiBaseUrl: process.env.API_BASE_URL || 'https://solobmen.onrender.com'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));