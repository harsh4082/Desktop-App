// models/Department.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentCount: { type: Number, default: 0 }
});

const departmentSchema = new mongoose.Schema({
  departmentId: {
    type: String,
    default: () => `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
    unique: true
  },
  name: { type: String, required: true, unique: true },
  hod: { type: String },
  classes: [classSchema]
});

module.exports = mongoose.model('Department', departmentSchema);
