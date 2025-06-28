require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/solana-exchange',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-key-here',
  PORT: process.env.PORT || 3000
};