const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  solBalance: { type: Number, default: 0 },
  usdtBalance: { type: Number, default: 0 },
  depositAddress: { type: String, default: generateDepositAddress },
  createdAt: { type: Date, default: Date.now }
});

// Генерация адреса депозита
function generateDepositAddress() {
  return 'SOL' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Хеширование пароля перед сохранением
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Метод для проверки пароля
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);