const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g., "FY" or "First Year"
  studentCount: { type: Number, default: 0 }    // total students in this class
});

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  hod: { type: String },
  classes: [classSchema] // Array of dynamic classes
});

module.exports = mongoose.model('Department', departmentSchema);
