require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const { Telegraf, Markup } = require('telegraf');
const User = require('./models/User'); // Укажи правильный путь к модели User

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware и статика
app.use(cors({
  origin: ['http://localhost:3000', 'https://solobmen.onrender.com'], 
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Роуты
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.render('index', { 
    apiBaseUrl: process.env.API_BASE_URL || 'https://solobmen.onrender.com'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Подключаемся к MongoDB и запускаем сервер и бота после успешного подключения
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  // Запускаем Express сервер
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Инициализируем и запускаем Telegram-бота
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // Пример: команда /start
  bot.start(async (ctx) => {
    try {
      const { id, username, first_name, last_name } = ctx.from;

      const user = await User.findOneAndUpdate(
        { telegramId: id },
        {
          telegramId: id,
          telegramData: { username, first_name, last_name },
          lastActivity: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await ctx.replyWithHTML(
        `👋 <b>Добро пожаловать, ${first_name || 'пользователь'}!</b>\n\n` +
        `Ваш баланс:\n` +
        `SOL: ${user.solBalance.toFixed(4)}\n` +
        `USDT: ${user.usdtBalance.toFixed(2)}`,
        Markup.keyboard([
          Markup.button.webApp('💰 Обменник', 'https://solobmen.onrender.com'),
          Markup.button.text('📊 Баланс')
        ]).resize()
      );
    } catch (err) {
      console.error('Ошибка в /start бота:', err);
      ctx.reply('⚠️ Произошла ошибка. Попробуйте позже.');
    }
  });

  // Пример: обработка текста "📊 Баланс"
  bot.hears('📊 Баланс', async (ctx) => {
    try {
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (!user) return ctx.reply('Пользователь не найден.');

      ctx.replyWithHTML(
        `Ваш баланс:\n` +
        `SOL: <b>${user.solBalance.toFixed(4)}</b>\n` +
        `USDT: <b>${user.usdtBalance.toFixed(2)}</b>\n\n` +
        `Депозитный адрес:\n<code>${user.depositAddress}</code>`
      );
    } catch (err) {
      console.error('Ошибка при показе баланса:', err);
      ctx.reply('Ошибка при получении баланса.');
    }
  });

  // Обработка данных из WebApp
  bot.on('web_app_data', async (ctx) => {
    try {
      const data = JSON.parse(ctx.webAppData.data);
      // Тут можешь обрабатывать данные, полученные из WebApp
      console.log('Получены данные из WebApp:', data);
    } catch (err) {
      console.error('Ошибка обработки web_app_data:', err);
    }
  });

  bot.catch((err) => {
    console.error('Общая ошибка бота:', err);
  });

  bot.launch();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
