const mongoose = require('mongoose');

// Функция генерации депозитного адреса (пример)
function generateDepositAddress() {
  return 'SOL' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const userSchema = new mongoose.Schema({
  // Можно убрать уникальный индекс username, если не нужен
  username: { type: String, unique: true, sparse: true },

  password: { type: String },

  solBalance: { type: Number, default: 0 },
  usdtBalance: { type: Number, default: 0 },
  depositAddress: { type: String, default: generateDepositAddress }, // теперь функция есть!

  createdAt: { type: Date, default: Date.now },

  // Telegram
  telegramId: { type: Number, unique: true, sparse: true },
  telegramData: {
    username: { type: String, sparse: true },
    first_name: String,
    last_name: String
  },
  lastActivity: Date
});

// Индексы
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ telegramId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
