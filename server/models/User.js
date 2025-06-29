const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Убери или не используй уникальный индекс на username в корне
  username: { type: String, unique: true, sparse: true }, // если нужно, можно удалить вообще
  password: { type: String },

  solBalance: { type: Number, default: 0 },
  usdtBalance: { type: Number, default: 0 },
  depositAddress: { type: String, default: generateDepositAddress },
  createdAt: { type: Date, default: Date.now },

  // Telegram
  telegramId: { type: Number, unique: true, sparse: true },
  telegramData: {
    username: { type: String, sparse: true }, // вложенное поле, без уникальности
    first_name: String,
    last_name: String
  },
  lastActivity: Date
});

// Индексы - важен sparse для username
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ telegramId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
