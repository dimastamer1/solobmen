// server/models/CaptchaPass.js
const mongoose = require('mongoose');

const captchaPassSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CaptchaPass', captchaPassSchema);