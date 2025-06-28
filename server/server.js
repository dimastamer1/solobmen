require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const captchaRoutes = require('./routes/captcha');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Настройки CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://solobmen.onrender.com',
    'https://your-frontend-domain.com'
  ],
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Маршруты API
app.use('/captcha', captchaRoutes);

// Обработка статических файлов
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { 
    apiBaseUrl: process.env.API_BASE_URL || 'https://solobmen.onrender.com'
  });
});

app.get('/deposit', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/deposit.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});