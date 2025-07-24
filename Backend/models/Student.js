const mongoose = require('mongoose');

const selectedQuestionSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamQuestion', required: true },
  selectedAnswerId: { type: String }, // The selected option's ID
});

const studentExamSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  examStartTime: { type: Date },
  examEndTime: { type: Date },
  status: { type: String, enum: ['approved', 'rejected', 'pending', 'submitted', 'auto-submitted'], default: 'pending' },
  selectedAnswers: [selectedQuestionSchema],
  score: { type: Number, default: 0 },
});

const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  rollNo: { type: String, unique: true, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  class: { type: String, enum: ['FY', 'SY', 'TY'] },
  exams: [studentExamSchema],
});

module.exports = mongoose.model('Student', studentSchema);
