require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error', err));

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

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
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💰 Открыть обменник',
                web_app: { url: process.env.API_BASE_URL }
              }
            ],
            [
              { text: '📊 Посмотреть баланс', callback_data: 'balance' }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error('Telegram error:', err);
    ctx.reply('Произошла ошибка.');
  }
});

// 📊 Обработка inline кнопки "Посмотреть баланс"
bot.on('callback_query', async (ctx) => {
  if (ctx.callbackQuery.data === 'balance') {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (user) {
      await ctx.answerCbQuery();
      await ctx.replyWithHTML(
        `📊 Баланс:\n` +
        `SOL: <b>${user.solBalance.toFixed(4)}</b>\n` +
        `USDT: <b>${user.usdtBalance.toFixed(2)}</b>\n\n` +
        `💳 Адрес депозита:\n<code>${user.depositAddress}</code>`
      );
    }
  }
});

// Обработка данных из WebApp
bot.on('web_app_data', (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    console.log('📦 Получены данные из WebApp:', data);
  } catch (err) {
    console.error('Ошибка парсинга web_app_data:', err);
  }
});

bot.catch((err) => console.error('Bot error:', err));

bot.launch().then(() => console.log('🤖 Бот запущен'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
