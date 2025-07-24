const mongoose = require('mongoose');

const answerOptionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Unique identifier for answer (like UUID or "A", "B", etc.)
  text: { type: String, required: true },
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  answerOptions: [answerOptionSchema], // All options
  correctAnswerId: { type: String, required: true }, // ID must match one from answerOptions
});

const examQuestionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  class: { type: String, enum: ['FY', 'SY', 'TY'], required: true },
  set: { type: String }, // e.g., "Set 1"
  questions: [questionSchema],
});

module.exports = mongoose.model('ExamQuestion', examQuestionSchema);
