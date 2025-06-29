require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const User = require('./models/User');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// /start — создаёт/обновляет пользователя, даёт кнопку WebApp
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
  } catch (error) {
    console.error('Telegram bot error:', error);
    ctx.reply('⚠️ Произошла ошибка. Попробуйте позже.');
  }
});

// Обработка кнопки "Баланс"
bot.hears('📊 Баланс', async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from.id });
  if (user) {
    await ctx.replyWithHTML(
      `Ваш баланс:\n` +
      `SOL: <b>${user.solBalance.toFixed(4)}</b>\n` +
      `USDT: <b>${user.usdtBalance.toFixed(2)}</b>\n\n` +
      `Депозитный адрес:\n<code>${user.depositAddress}</code>`
    );
  } else {
    ctx.reply('Пользователь не найден.');
  }
});

// Обработка данных из WebApp
bot.on('web_app_data', async (ctx) => {
  try {
    // ctx.webAppData.data — это строка JSON
    const data = JSON.parse(ctx.webAppData.data);

    console.log('Получены данные из WebApp:', data);

    // Можно дальше обработать данные и ответить пользователю
    await ctx.reply('Данные успешно получены!');
  } catch (e) {
    console.error('Ошибка обработки web_app_data:', e);
    await ctx.reply('Ошибка при обработке данных из WebApp.');
  }
});

bot.catch(err => console.error('Bot error:', err));

bot.launch()
  .then(() => console.log('🤖 Telegram bot started'))
  .catch(err => console.error('❌ Bot error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
