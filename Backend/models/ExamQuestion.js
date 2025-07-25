const mongoose = require('mongoose');

// 🔹 Generate custom ID like "QST-123456" or "EXM-123456"
const generateCustomId = (prefix = 'ID') => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
};

// 🔸 Answer Options Schema
const answerOptionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // "A", "B", "C" etc.
  text: { type: String, required: true },
});

// 🔸 Individual Question Schema (includes set info)
const questionSchema = new mongoose.Schema({
  questionId: { type: String, default: () => generateCustomId('QST'), unique: true },
  questionText: { type: String, required: true },
  answerOptions: [answerOptionSchema],
  correctAnswerId: { type: String, required: true },
  score: { type: Number, default: 1 },
  set: { type: String, required: true },
  setIndex: { type: Number } // 👈 Index of the question within its set
});

// 🔸 Main Exam Question Set Schema
const examQuestionSchema = new mongoose.Schema({
  examId: { type: String, unique: true, default: () => generateCustomId('EXM') }, // 👈 New examId
  subjectId: { type: String, required: true },
  class: { type: String, required: true },
  questions: [questionSchema],
  totalQuestions: { type: Number, default: 0 }
});

// 🔸 Auto-count total questions
examQuestionSchema.pre('save', function (next) {
  this.totalQuestions = this.questions.length;
  next();
});

module.exports = mongoose.model('ExamQuestion', examQuestionSchema);
