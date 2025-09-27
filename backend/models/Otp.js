const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  phone: String,
  code: String,
  expiresAt: Date
});

module.exports = mongoose.model('OTP', OTPSchema);
