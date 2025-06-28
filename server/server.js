require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/auth');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к MongoDB с улучшенными настройками
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Расширенные настройки CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://solobmen.onrender.com',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Предварительные запросы

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Улучшенная конфигурация сессии
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 день
    sameSite: 'none',
    secure: true,
    httpOnly: true
  }
}));

// Маршруты API
app.use('/auth', authRoutes);

// Обработка статических файлов и SPA
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { 
    user: req.session.user,
    apiBaseUrl: process.env.API_BASE_URL || 'https://solobmen.onrender.com'
  });
});

app.get('/deposit', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/deposit.html'));
});

// Обработка 404 для API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback для SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}`}`);
});