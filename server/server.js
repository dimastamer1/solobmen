require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // Language selection handler
  const sendLanguageSelection = async (ctx) => {
    try {
      await ctx.reply('🌍 Please choose your language / Пожалуйста, выберите язык:', {
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback('English 🇬🇧', 'SET_LANG_EN'),
              Markup.button.callback('Русский 🇷🇺', 'SET_LANG_RU')
            ]
          ]
        }
      });
    } catch (err) {
      console.error('Language selection error:', err);
    }
  };

  // Welcome messages in both languages
  const welcomeMessages = {
    en: (name) => `
🎉 *Welcome to Solana Exchange, ${name || 'user'}!* 🎉

🚀 *Why choose us?*
• Best exchange rates for SOL/USDT
• 0% commission on all trades
• Instant transactions on Solana network
• Secure and reliable service since 2019

💱 *Minimum deposits:*
Minimum deposit 0.05 SOL
Minimum deposit 5 USDT

We recommend checking our Policy before trading. Happy exchanging! 💰
    `,
    ru: (name) => `
🎉 *Добро пожаловать в Solana Exchange, ${name || 'пользователь'}!* 🎉

🚀 *Почему выбирают нас?*
• Лучшие курсы обмена SOL/USDT
• 0% комиссии на все операции
• Мгновенные транзакции в сети Solana
• Надежный сервис с 2019 года

💱 *Минимальные депозиты:*
Минимальный депозит 0.05 SOL
Минимальный депозит 5 USDT

Рекомендуем ознакомиться с нашей Политикой перед обменом. Удачных операций! 💰
    `
  };

  // Policy messages
  const policyMessages = {
    en: `
🔒 *Our Privacy Policy & Security*

At Solana Exchange, we prioritize your security:

• We operate exclusively on Solana blockchain (SPL tokens)
• We never store your private keys or sensitive data
• All transactions are processed through smart contracts
• We comply with international crypto regulations

Your funds are protected by:
- Multi-signature wallets
- Cold storage for 95% of assets
- Regular security audits
    `,
    ru: `
🔒 *Наша Политика Конфиденциальности и Безопасности*

В Solana Exchange ваша безопасность - наш приоритет:

• Работаем исключительно в сети Solana (SPL-токены)
• Никогда не храним ваши приватные ключи
• Все операции через смарт-контракты
• Соблюдаем международные крипто-регламенты

Ваши средства защищены:
- Мультиподписные кошельки
- Холодное хранение 95% активов
- Регулярные аудиты безопасности
    `
  };

  // How we work messages
  const howWeWorkMessages = {
    en: `
🛠 *How We Work & Our Story*

Founded in 2019, we migrated to Telegram to provide better service:

• 2019: Started as SolSwap on Google Sites
• 2021: Launched mobile app with 50k+ users
• 2023: Fully transitioned to Telegram bots
• 2024: Processed $10M+ in trades

Our advantages:
✅ 24/7 customer support
✅ Best rates from 10+ liquidity providers
✅ Non-custodial exchange model
✅ Regular market analysis updates
    `,
    ru: `
🛠 *Как мы работаем и наша история*

Основаны в 2019, перешли в Telegram для лучшего сервиса:

• 2019: Начали как SolSwap на Google Sites
• 2021: Запустили мобильное приложение (50k+ пользователей)
• 2023: Полностью перешли на Telegram-ботов
• 2024: Обработано $10M+ операций

Наши преимущества:
✅ Поддержка 24/7
✅ Лучшие курсы от 10+ поставщиков ликвидности
✅ Некастодиальная модель обмена
✅ Регулярная аналитика рынка
    `
  };

  // FAQ messages
  const faqMessages = {
    en: `
❓ *Frequently Asked Questions*

*Q: What's your advantage over competitors?*
A: We aggregate rates from multiple exchanges and pass savings to you with 0% commission.

*Q: How long have you been operating?*
A: Since 2019 (over 4 years) across web and mobile platforms.

*Q: Is there a minimum exchange amount?*
A: Yes, 5 USDT or 0.05 SOL for all transactions.

*Q: How fast are transactions?*
A: Typically under 50+ seconds on Solana network.

*Q: Do you support other cryptocurrencies?*
A: Currently only SOL and USDT (SPL tokens).
    `,
    ru: `
❓ *Часто задаваемые вопросы*

*В: Какое ваше преимущество перед конкурентами?*
О: Мы агрегируем курсы с бирж и предлагаем вам лучшие условия без комиссий.

*В: Как долго вы работаете?*
О: С 2019 года (более 4 лет) на различных платформах.

*В: Есть ли минимальная сумма обмена?*
О: Да, от 5 USDT или 0.05 SOL для всех операций.

*В: Как быстро проходят транзакции?*
О: Обычно до 50 секунд в сети Solana.

*В: Поддерживаете другие криптовалюты?*
О: Пока только SOL и USDT (SPL-токены).
    `
  };

  // Start command handler
  bot.start(async (ctx) => {
    try {
      const { id } = ctx.from;
      
      // Initialize user without language
      await User.findOneAndUpdate(
        { telegramId: id },
        { telegramId: id, lastActivity: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await sendLanguageSelection(ctx);
    } catch (err) {
      console.error('Start command error:', err);
      ctx.reply('⚠️ An error occurred. Please try again later.');
    }
  });

  // Language selection handlers
  bot.action('SET_LANG_EN', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await User.updateOne({ telegramId: ctx.from.id }, { language: 'en' });
      await showMainMenu(ctx, 'en');
    } catch (err) {
      console.error('Set EN language error:', err);
    }
  });

  bot.action('SET_LANG_RU', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await User.updateOne({ telegramId: ctx.from.id }, { language: 'ru' });
      await showMainMenu(ctx, 'ru');
    } catch (err) {
      console.error('Set RU language error:', err);
    }
  });

  // Show main menu with selected language
  const showMainMenu = async (ctx, lang) => {
    try {
      const user = await User.findOne({ telegramId: ctx.from.id });
      const name = ctx.from.first_name;
      
      // Try to delete previous message if it exists
      try {
        if (ctx.callbackQuery?.message?.message_id) {
          await ctx.deleteMessage();
        }
      } catch (deleteError) {
        console.log('Could not delete previous message, continuing...');
      }
      
      await ctx.replyWithPhoto(
        { url: 'https://quark.house/wp-content/uploads/2024/11/solana-1024x576.jpg' },
        {
          caption: welcomeMessages[lang](name),
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                Markup.button.webApp('💰 ' + (lang === 'en' ? 'Open Exchange' : 'Открыть Обменник'), 
                'https://solobmen.onrender.com'),
              ],
              [
                Markup.button.callback('🔒 ' + (lang === 'en' ? 'Policy' : 'Политика'), 'SHOW_POLICY'),
                Markup.button.callback('🛠 ' + (lang === 'en' ? 'How We Work' : 'Как мы работаем'), 'SHOW_HOW')
              ],
              [
                Markup.button.callback('❓ FAQ', 'SHOW_FAQ')
              ]
            ]
          }
        }
      );
    } catch (err) {
      console.error('Show main menu error:', err);
      // Fallback to simple message if photo fails
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      await ctx.reply(welcomeMessages[lang](ctx.from.first_name), {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.webApp('💰 ' + (lang === 'en' ? 'Open Exchange' : 'Открыть Обменник'), 
              'https://solobmen.onrender.com'),
          ],
          [
            Markup.button.callback('🔒 ' + (lang === 'en' ? 'Policy' : 'Политика'), 'SHOW_POLICY'),
            Markup.button.callback('🛠 ' + (lang === 'en' ? 'How We Work' : 'Как мы работаем'), 'SHOW_HOW')
          ],
          [
            Markup.button.callback('❓ FAQ', 'SHOW_FAQ')
          ]
        ])
      });
    }
  };

  // Policy callback
  bot.action('SHOW_POLICY', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      await ctx.replyWithMarkdown(policyMessages[lang], Markup.inlineKeyboard([
        [Markup.button.callback('← ' + (lang === 'en' ? 'Back to Main Menu' : 'Назад в меню'), 'BACK_TO_MAIN')]
      ]));
    } catch (err) {
      console.error('Policy error:', err);
    }
  });

  // How we work callback
  bot.action('SHOW_HOW', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      await ctx.replyWithMarkdown(howWeWorkMessages[lang], Markup.inlineKeyboard([
        [Markup.button.callback('← ' + (lang === 'en' ? 'Back to Main Menu' : 'Назад в меню'), 'BACK_TO_MAIN')]
      ]));
    } catch (err) {
      console.error('How we work error:', err);
    }
  });

  // FAQ callback
  bot.action('SHOW_FAQ', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      await ctx.replyWithMarkdown(faqMessages[lang], Markup.inlineKeyboard([
        [Markup.button.callback('← ' + (lang === 'en' ? 'Back to Main Menu' : 'Назад в меню'), 'BACK_TO_MAIN')]
      ]));
    } catch (err) {
      console.error('FAQ error:', err);
    }
  });

  // Back to main menu
  bot.action('BACK_TO_MAIN', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      try {
        await ctx.deleteMessage();
      } catch (deleteError) {
        console.log('Could not delete message, continuing...');
      }
      await showMainMenu(ctx, lang);
    } catch (err) {
      console.error('Back to main error:', err);
    }
  });

  // WebApp data handler
  bot.on('web_app_data', async (ctx) => {
    try {
      const data = JSON.parse(ctx.webAppData.data);
      console.log('WebApp data received:', data);
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      await ctx.reply(lang === 'en' 
        ? '✅ Transaction data received! Processing your exchange...' 
        : '✅ Данные транзакции получены! Обрабатываем ваш обмен...');
    } catch (err) {
      console.error('WebApp error:', err);
    }
  });

  // Error handling
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  // Launch bot with webhook for production
  if (process.env.NODE_ENV === 'production') {
    bot.launch({
      webhook: {
        domain: process.env.WEBHOOK_DOMAIN,
        port: PORT
      }
    }).then(() => {
      console.log('🤖 Bot running in production mode with webhook');
    });
  } else {
    bot.launch().then(() => {
      console.log('🤖 Bot running in development mode with polling');
    });
  }

  // Graceful shutdown
  process.once('SIGINT', () => {
    bot.stop('SIGINT');
    server.close();
  });
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    server.close();
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});