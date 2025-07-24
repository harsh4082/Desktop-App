const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  name: { type: String }, // e.g., "Set 1", "Set 2"
  totalExams: { type: Number, default: 0 },
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, enum: ['FY', 'SY', 'TY'], required: true },
  teacherName: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  totalStudents: { type: Number, default: 0 },
  sets: [setSchema]
});

module.exports = mongoose.model('Subject', subjectSchema);
