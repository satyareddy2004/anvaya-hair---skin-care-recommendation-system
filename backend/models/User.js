const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: { type: String }, // For password reset
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);