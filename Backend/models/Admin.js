// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    default: () => `ADM-${Math.floor(100000 + Math.random() * 900000)}`,
    unique: true
  },
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('Admin', adminSchema);
