const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  filename: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Analysis', analysisSchema);