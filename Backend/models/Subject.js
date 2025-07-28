// models/Subject.js
const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  name: { type: String }, // e.g., "Set 1", "Set 2"
  students: { type: Number, default: 0 }, // number of students in this set
});

const subjectSchema = new mongoose.Schema({
  subjectId: {
    type: String,
    default: () => `SUB-${Math.floor(100000 + Math.random() * 900000)}`,
    unique: true,
  },
  status : {type: String} ,
  name: { type: String, required: true },
  class: { type: String, required: true }, // removed enum
  teacherName: { type: String },
  departmentId: { type: String, required: true }, // custom departmentId instead of ObjectId
  totalStudents: { type: Number, default: 0 },
  sets: [setSchema],
});

module.exports = mongoose.model('Subject', subjectSchema);
