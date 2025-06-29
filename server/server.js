require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors({
  origin: ['http://localhost:3000', 'https://solobmen.onrender.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Routes
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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Initialize Telegram bot
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // ======================
  // MESSAGE CONTENT
  // ======================

  const content = {
    welcome: {
      en: (name) => `🎉 *Welcome to Solana Exchange, ${name || 'user'}!* 🎉\n\n🚀 *Why choose us?*\n• Best exchange rates\n• 0% commission\n• Instant transactions\n• Secure since 2019\n\n💱 *Minimum deposits:*\n0.05 SOL or 5 USDT`,
      ru: (name) => `🎉 *Добро пожаловать в Solana Exchange, ${name || 'пользователь'}!* 🎉\n\n🚀 *Почему выбирают нас?*\n• Лучшие курсы\n• 0% комиссии\n• Мгновенные транзакции\n• Надежно с 2019\n\n💱 *Минимумы:*\n0.05 SOL или 5 USDT`
    },
    policy: {
      en: `🔒 *Our Privacy Policy*\n\n• Only Solana blockchain\n• No key storage\n• Smart contracts\n• Security audits`,
      ru: `🔒 *Наша Политика*\n\n• Только Solana\n• Не храним ключи\n• Смарт-контракты\n• Аудит безопасности`
    },
    howWeWork: {
      en: `🛠 *How We Work*\n\n• Since 2019\n• 50k+ users\n• $10M+ processed\n• 24/7 support`,
      ru: `🛠 *Как мы работаем*\n\n• С 2019 года\n• 50k+ пользователей\n• $10M+ операций\n• Поддержка 24/7`
    },
    faq: {
      en: `❓ *FAQ*\n\n*Q: Advantage?*\nA: Best rates, 0% fee\n\n*Q: Minimum?*\nA: 5 USDT/0.05 SOL`,
      ru: `❓ *Частые вопросы*\n\n*В: Преимущество?*\nО: Лучшие курсы, 0% комиссий\n\n*В: Минимум?*\nО: 5 USDT/0.05 SOL`
    }
  };

  // ======================
  // BOT HANDLERS
  // ======================

  // Start command
  bot.start(async (ctx) => {
    try {
      const { id } = ctx.from;
      await User.findOneAndUpdate(
        { telegramId: id },
        { telegramId: id, lastActivity: new Date() },
        { upsert: true, new: true }
      );
      await sendLanguageSelection(ctx);
    } catch (err) {
      console.error('Start error:', err);
      ctx.reply('⚠️ Error occurred. Please try again.');
    }
  });

  // Language selection
  const sendLanguageSelection = async (ctx) => {
    try {
      await ctx.reply('🌍 Choose language / Выберите язык:', {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('English 🇬🇧', 'SET_LANG_EN')],
          [Markup.button.callback('Русский 🇷🇺', 'SET_LANG_RU')]
        ])
      });
    } catch (err) {
      console.error('Language selection error:', err);
    }
  };

  // Language handlers
  bot.action('SET_LANG_EN', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await User.updateOne({ telegramId: ctx.from.id }, { language: 'en' });
      await showMainMenu(ctx, 'en');
    } catch (err) {
      console.error('EN language error:', err);
    }
  });

  bot.action('SET_LANG_RU', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await User.updateOne({ telegramId: ctx.from.id }, { language: 'ru' });
      await showMainMenu(ctx, 'ru');
    } catch (err) {
      console.error('RU language error:', err);
    }
  });

  // Main menu
  const showMainMenu = async (ctx, lang) => {
    try {
      const user = await User.findOne({ telegramId: ctx.from.id });
      const name = ctx.from.first_name;

      // Safe message deletion
      try {
        if (ctx.callbackQuery?.message) {
          await ctx.deleteMessage();
        }
      } catch (e) {
        console.log('Message deletion skipped:', e.message);
      }

      // Try with photo first
      try {
        await ctx.replyWithPhoto(
          { url: 'https://quark.house/wp-content/uploads/2024/11/solana-1024x576.jpg' },
          {
            caption: content.welcome[lang](name),
            parse_mode: 'Markdown',
            reply_markup: Markup.inlineKeyboard([
              [Markup.button.webApp(
                '💰 ' + (lang === 'en' ? 'Exchange' : 'Обменник'), 
                'https://solobmen.onrender.com'
              )],
              [
                Markup.button.callback('🔒 ' + (lang === 'en' ? 'Policy' : 'Политика'), 'SHOW_POLICY'),
                Markup.button.callback('🛠 ' + (lang === 'en' ? 'How We Work' : 'Как работаем'), 'SHOW_HOW')
              ],
              [Markup.button.callback('❓ FAQ', 'SHOW_FAQ')]
            ])
          }
        );
        return;
      } catch (photoError) {
        console.log('Photo send failed, falling back to text:', photoError);
      }

      // Fallback to text message
      await ctx.reply(
        content.welcome[lang](name),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.webApp(
                '💰 ' + (lang === 'en' ? 'Exchange' : 'Обменник'), 
                'https://solobmen.onrender.com'
              )],
              [
                Markup.button.callback('🔒 ' + (lang === 'en' ? 'Policy' : 'Политика'), 'SHOW_POLICY'),
                Markup.button.callback('🛠 ' + (lang === 'en' ? 'How We Work' : 'Как работаем'), 'SHOW_HOW')
              ],
              [Markup.button.callback('❓ FAQ', 'SHOW_FAQ')]
            ]
          }
        }
      );
    } catch (err) {
      console.error('Main menu error:', err);
    }
  };

  // Info sections
  const showInfoSection = async (ctx, section) => {
    try {
      await ctx.answerCbQuery();
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      await ctx.replyWithMarkdown(
        content[section][lang],
        Markup.inlineKeyboard([
          [Markup.button.callback(
            '← ' + (lang === 'en' ? 'Back' : 'Назад'), 
            'BACK_TO_MAIN'
          )]
        ])
      );
    } catch (err) {
      console.error(`${section} error:`, err);
    }
  };

  bot.action('SHOW_POLICY', (ctx) => showInfoSection(ctx, 'policy'));
  bot.action('SHOW_HOW', (ctx) => showInfoSection(ctx, 'howWeWork'));
  bot.action('SHOW_FAQ', (ctx) => showInfoSection(ctx, 'faq'));

  // Back to main
  bot.action('BACK_TO_MAIN', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      try {
        await ctx.deleteMessage();
      } catch (e) {
        console.log('Back message deletion skipped:', e.message);
      }
      
      await showMainMenu(ctx, lang);
    } catch (err) {
      console.error('Back error:', err);
    }
  });

  // WebApp handler
  bot.on('web_app_data', async (ctx) => {
    try {
      const data = JSON.parse(ctx.webAppData.data);
      console.log('WebApp data:', data);
      const user = await User.findOne({ telegramId: ctx.from.id });
      const lang = user?.language || 'en';
      
      await ctx.reply(
        lang === 'en' 
          ? '✅ Transaction received! Processing...' 
          : '✅ Данные получены! Обработка...'
      );
    } catch (err) {
      console.error('WebApp error:', err);
    }
  });

  // Error handling
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  // Bot launch
  const launchBot = async () => {
    if (process.env.NODE_ENV === 'production') {
      // Webhook configuration
      const domain = process.env.WEBHOOK_DOMAIN || `https://solobmen.onrender.com`;
      const hookPath = `/bot${process.env.TELEGRAM_BOT_TOKEN}`;
      
      console.log(`🌐 Webhook configured at ${domain}${hookPath}`);
      
      await bot.launch({
        webhook: {
          domain: domain,
          port: PORT,
          hookPath: hookPath
        }
      });
    } else {
      // Polling in development
      await bot.launch();
      console.log('🔎 Bot polling for updates');
    }
    console.log('🤖 Bot started successfully');
  };

  launchBot().catch(err => {
    console.error('❌ Bot launch failed:', err);
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = () => {
    bot.stop();
    server.close();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});