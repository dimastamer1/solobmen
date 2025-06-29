require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// CORS — добавь сюда свой фронтенд адрес (React/Vue/что-то)
app.use(cors({
  origin: ['http://localhost:3000', 'https://solobmen.onrender.com'], 
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// Парсеры
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статика для фронтенда (если билд React в /public)
app.use(express.static(path.join(__dirname, '../public')));

// Настройка EJS если нужна (вроде есть)
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Главная страница — отдаём index.ejs или React
app.get('/', (req, res) => {
  res.render('index', { 
    apiBaseUrl: process.env.API_BASE_URL || 'https://solobmen.onrender.com'
  });
});

// 404 для остальных маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
