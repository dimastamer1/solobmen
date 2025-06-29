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

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // Welcome message with Solana image and rich text
  const welcomeMessage = (name) => `
🎉 *Welcome to Solana Exchange, ${name || 'user'}!* 🎉

🚀 *Why choose us?*
• Best exchange rates for SOL/USDT
• 0% commission on all trades
• Instant transactions on Solana network
• Secure and reliable service since 2019

💱 *Current rates:*
1 SOL = ~160 USDT
1 USDT = ~0.00625 SOL

${'https://quark.house/wp-content/uploads/2024/11/solana-1024x576.jpg'}

We recommend checking our Policy before trading. Happy exchanging! 💰
  `;

  // Policy message
  const policyMessage = `
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

For full terms: [Visit our website](${process.env.API_BASE_URL})
  `;

  // How we work message
  const howWeWorkMessage = `
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
  `;

  // FAQ message
  const faqMessage = `
❓ *Frequently Asked Questions*

*Q: What's your advantage over competitors?*
A: We aggregate rates from multiple exchanges and pass savings to you with 0% commission.

*Q: How long have you been operating?*
A: Since 2019 (over 4 years) across web and mobile platforms.

*Q: Is there a minimum exchange amount?*
A: Yes, 5 USDT or 0.01 SOL for all transactions.

*Q: How fast are transactions?*
A: Typically under 30 seconds on Solana network.

*Q: Do you support other cryptocurrencies?*
A: Currently only SOL and USDT (SPL tokens).

Need more help? Contact @SolanaSupportBot
  `;

  // Start command handler
  bot.start(async (ctx) => {
    try {
      const { id, first_name } = ctx.from;
      
      const updateData = {
        telegramId: id,
        lastActivity: new Date()
      };

      const user = await User.findOneAndUpdate(
        { telegramId: id },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await ctx.replyWithPhoto(
        { url: 'https://quark.house/wp-content/uploads/2024/11/solana-1024x576.jpg' },
        {
          caption: welcomeMessage(first_name),
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.webApp('💰 Open Exchange', 'https://solobmen.onrender.com'),
            ],
            [
              Markup.button.callback('🔒 Policy', 'SHOW_POLICY'),
              Markup.button.callback('🛠 How We Work', 'SHOW_HOW')
            ],
            [
              Markup.button.callback('❓ FAQ', 'SHOW_FAQ')
            ]
          ])
        }
      );
    } catch (err) {
      console.error('Start command error:', err);
      ctx.reply('⚠️ An error occurred. Please try again later.');
    }
  });

  // Policy callback
  bot.action('SHOW_POLICY', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(policyMessage, Markup.inlineKeyboard([
        [Markup.button.callback('← Back to Main Menu', 'BACK_TO_MAIN')]
      ]));
    } catch (err) {
      console.error('Policy error:', err);
    }
  });

  // How we work callback
  bot.action('SHOW_HOW', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(howWeWorkMessage, Markup.inlineKeyboard([
        [Markup.button.callback('← Back to Main Menu', 'BACK_TO_MAIN')]
      ]));
    } catch (err) {
      console.error('How we work error:', err);
    }
  });

  // FAQ callback
  bot.action('SHOW_FAQ', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(faqMessage, Markup.inlineKeyboard([
        [Markup.button.callback('← Back to Main Menu', 'BACK_TO_MAIN')]
      ]));
    } catch (err) {
      console.error('FAQ error:', err);
    }
  });

  // Back to main menu
  bot.action('BACK_TO_MAIN', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      await ctx.replyWithPhoto(
        { url: 'https://quark.house/wp-content/uploads/2024/11/solana-1024x576.jpg' },
        {
          caption: welcomeMessage(ctx.from.first_name),
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.webApp('💰 Open Exchange', 'https://solobmen.onrender.com'),
            ],
            [
              Markup.button.callback('🔒 Policy', 'SHOW_POLICY'),
              Markup.button.callback('🛠 How We Work', 'SHOW_HOW')
            ],
            [
              Markup.button.callback('❓ FAQ', 'SHOW_FAQ')
            ]
          ])
        }
      );
    } catch (err) {
      console.error('Back to main error:', err);
    }
  });

  // WebApp data handler
  bot.on('web_app_data', async (ctx) => {
    try {
      const data = JSON.parse(ctx.webAppData.data);
      console.log('WebApp data received:', data);
      await ctx.reply('✅ Transaction data received! Processing your exchange...');
    } catch (err) {
      console.error('WebApp error:', err);
    }
  });

  // Error handling
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  // Launch bot
  bot.launch();

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});