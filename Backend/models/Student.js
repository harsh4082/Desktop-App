const mongoose = require('mongoose');

// 🔹 Generate custom ID like "STD-123456"
const generateCustomId = (prefix = 'ID') => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
};

// 1. Each selected question with its correctness and individual score
const selectedQuestionSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamQuestion', required: true },
  selectedAnswerId: { type: String },
  isCorrect: { type: Boolean, default: false },
  score: { type: Number, default: 0 }, // 1 for correct, 0 for wrong
});

// 2. Exam details per subject attempt
const studentExamSchema = new mongoose.Schema({
  subjectId: { type: String, required: true }, // Custom subject ID like "SUB-123456"
  examStartTime: { type: Date },
  examEndTime: { type: Date },
  status: {
    type: String,
    enum: ['approved', 'rejected', 'pending', 'submitted', 'auto-submitted'],
    default: 'pending',
  },
  selectedAnswers: [selectedQuestionSchema],
  score: { type: Number, default: 0 },      // Actual marks scored
  totalScore: { type: Number, default: 0 }, // Total possible score in exam
});

// 3. Main Student schema
const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, default: () => generateCustomId('STD') },
  name: String,
  email: String,
  phone: String,
  rollNo: { type: String, required: true },     // Not unique
  departmentId: { type: String, required: true }, // Use custom department ID (e.g., DEP-XXXXX)
  class: { type: String }, // e.g., "FY", "SY", or custom
  exams: [studentExamSchema],
});

module.exports = mongoose.model('Student', studentSchema);
