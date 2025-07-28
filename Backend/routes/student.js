const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const ExamQuestion = require('../models/ExamQuestion');

// ✅ Email format checker (simple regex)
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// 🔹 Add single student
router.post('/add', async (req, res) => {
  try {
    const studentData = req.body;

    if (!isValidEmail(studentData.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // 📌 Check if email already exists
    const existing = await Student.findOne({ email: studentData.email });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const newStudent = new Student(studentData);
    await newStudent.save();

    res.status(201).json({ message: 'Student added successfully', student: newStudent });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Error adding student', error });
  }
});

// 🔹 Add multiple students
router.post('/add-multiple', async (req, res) => {
  try {
    const students = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Input should be a non-empty array of students' });
    }

    // 📌 Validate all emails are correctly formatted and not duplicated in the input
    const emails = students.map(s => s.email);
    const invalidEmails = emails.filter(email => !isValidEmail(email));
    const duplicateInInput = emails.filter((email, index) => emails.indexOf(email) !== index);

    if (invalidEmails.length > 0) {
      return res.status(400).json({ message: 'Invalid email(s) found', invalidEmails });
    }

    if (duplicateInInput.length > 0) {
      return res.status(400).json({ message: 'Duplicate emails in input array', duplicateInInput });
    }

    // 📌 Check if any of the emails already exist in DB
    const existingEmails = await Student.find({ email: { $in: emails } }, 'email');
    if (existingEmails.length > 0) {
      const existingList = existingEmails.map(e => e.email);
      return res.status(409).json({ message: 'Some emails already exist in DB', existingList });
    }

    // Add studentId if not present
    const enrichedStudents = students.map((student) => ({
      ...student,
      studentId: student.studentId || `STD-${Math.floor(100000 + Math.random() * 900000)}`,
    }));

    const inserted = await Student.insertMany(enrichedStudents);

    res.status(201).json({ message: 'Multiple students added successfully', students: inserted });
  } catch (error) {
    console.error('Add multiple students error:', error);
    res.status(500).json({ message: 'Error adding multiple students', error });
  }
});

// 🔹 Add an exam to a student by email
router.post('/add-exam-by-email', async (req, res) => {
  try {
    const { email, subjectId, status } = req.body;

    if (!email || !subjectId) {
      return res.status(400).json({ message: 'Email and subjectId are required' });
    }

    // 🔍 Validate subject existence and status
    const subject = await Subject.findOne({ subjectId });
    if (!subject) {
      return res.status(404).json({ message: `Subject with ID ${subjectId} not found` });
    }

    if (subject.status !== 'Active') {
      return res.status(400).json({ message: `Subject ${subjectId} is not active` });
    }

    // 🔍 Find student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // ❌ Prevent duplicate subjectId for this student
    const alreadyExists = student.exams.some(exam => exam.subjectId === subjectId);
    if (alreadyExists) {
      return res.status(409).json({ message: `Subject ${subjectId} already added for this student` });
    }

    // ✅ Create new exam object
    const newExam = {
      subjectId,
      examStartTime: null,
      examEndTime: null,
      status: status || 'pending',
      selectedAnswers: [],
      score: 0,
      totalScore: 0,
    };

    student.exams.push(newExam);
    await student.save();

    res.status(200).json({
      message: 'Exam added to student successfully',
      studentId: student.studentId,
      exams: student.exams,
    });

  } catch (error) {
    console.error('Error adding exam:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

router.post('/submit-exam', async (req, res) => {
  try {
    const { studentEmail, subjectId, selectedAnswers } = req.body;

    if (!studentEmail || !subjectId || !Array.isArray(selectedAnswers)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find the student's exam entry
    const studentExam = student.exams.find(e => e.subjectId === subjectId);
    if (!studentExam) {
      return res.status(400).json({ message: `No exam found for subject ${subjectId}` });
    }

    if (studentExam.status === 'submitted') {
      return res.status(400).json({ message: `Exam for subject ${subjectId} already submitted` });
    }

    // Fetch questions for the subject
    const examData = await ExamQuestion.findOne({ subjectId });
    if (!examData) {
      return res.status(404).json({ message: 'No questions found for this subject' });
    }

    const allQuestionsMap = {};
    for (const q of examData.questions) {
      allQuestionsMap[q.questionId] = q;
    }

    const updatedAnswers = [];
    let totalScore = 0;

    for (const answer of selectedAnswers) {
      const { questionId, selectedAnswerId } = answer;
      const question = allQuestionsMap[questionId];

      if (!question) {
        return res.status(400).json({ message: `Invalid questionId: ${questionId}` });
      }

      const isCorrect = question.correctAnswerId === selectedAnswerId;
      const score = isCorrect ? question.score : 0;

      totalScore += score;

      updatedAnswers.push({
        questionId,
        selectedAnswerId,
        isCorrect,
        score,
      });
    }

    // Update the exam record
    studentExam.selectedAnswers = updatedAnswers;
    studentExam.examStartTime = studentExam.examStartTime || new Date(); // Use existing if already started
    studentExam.examEndTime = new Date();
    studentExam.status = 'submitted';
    studentExam.score = totalScore;
    studentExam.totalScore = examData.questions.reduce((sum, q) => sum + q.score, 0);

    await student.save();

    res.status(200).json({
      message: 'Exam submitted successfully',
      studentId: student.studentId,
      subjectId,
      score: studentExam.score,
      totalScore: studentExam.totalScore,
      status: studentExam.status,
      answers: studentExam.selectedAnswers,
    });
  } catch (err) {
    console.error('Submit exam error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});



module.exports = router;
