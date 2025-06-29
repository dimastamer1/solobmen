const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function generateDepositAddress() {
  return 'SOL' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const userSchema = new mongoose.Schema({
  // Существующие поля
  username: { type: String, unique: true, sparse: true },
  password: { type: String },
  solBalance: { type: Number, default: 0 },
  usdtBalance: { type: Number, default: 0 },
  depositAddress: { type: String, default: generateDepositAddress },
  createdAt: { type: Date, default: Date.now },
  
  // Новые поля для Telegram
  telegramId: { type: Number, unique: true, sparse: true },
  telegramData: {
    username: String,
    first_name: String,
    last_name: String
  },
  lastActivity: Date
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);