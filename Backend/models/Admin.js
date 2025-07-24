const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true },
  password: { type: String, required: true }, // Should be hashed in production
});

module.exports = mongoose.model('Admin', adminSchema);
