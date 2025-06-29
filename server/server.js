require('dotenv').config();
require('./bot'); // Подключаем Telegram-бота
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
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.API_BASE_URL,
    'https://telegram.org'
  ],
  methods: ['GET', 'POST']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.get('/webapp', async (req, res) => {
  try {
    const initData = req.query.initData;
    if (!initData) return res.status(403).send('Missing initData');

    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    if (!userRaw) return res.status(403).send('User data missing');

    const telegramUser = JSON.parse(userRaw);
    const telegramId = telegramUser.id;

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(403).send('User not found');

    res.render('webapp', {
      user,
      apiBaseUrl: process.env.API_BASE_URL
    });
  } catch (err) {
    console.error('WebApp error:', err);
    res.status(500).send('Server error');
  }
});

app.get('/', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
