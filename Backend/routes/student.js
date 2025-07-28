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
router.post('/add-exam-by-emails', async (req, res) => {
  try {
    const { emails, subjectId } = req.body;

    // 🔍 Validate input
    if (!Array.isArray(emails) || emails.length === 0 || !subjectId) {
      return res.status(400).json({ message: 'Emails (array) and subjectId are required' });
    }

    // 🔍 Validate subject existence and status
    const subject = await Subject.findOne({ subjectId });
    if (!subject) {
      return res.status(404).json({ message: `Subject with ID ${subjectId} not found` });
    }

    if (subject.status !== 'Active') {
      return res.status(400).json({ message: `Subject ${subjectId} is not active` });
    }

    const results = {
      success: [],
      alreadyExists: [],
      notFound: [],
      failed: [],
    };

    // 🔄 Loop through each email
    for (const email of emails) {
      try {
        const student = await Student.findOne({ email });
        if (!student) {
          results.notFound.push(email);
          continue;
        }

        const alreadyHasExam = student.exams.some(exam => exam.subjectId === subjectId);
        if (alreadyHasExam) {
          results.alreadyExists.push(email);
          continue;
        }

        // ✅ Create new exam object
        const newExam = {
          subjectId,
          examStartTime: null,
          examEndTime: null,
          set: null,
          status: 'pending', // ← hardcoded
          selectedAnswers: [],
          score: 0,
          totalScore: 0,
        };

        student.exams.push(newExam);
        await student.save();
        results.success.push(email);
      } catch (err) {
        results.failed.push(email);
        console.error(`❌ Failed to add exam for ${email}:`, err.message);
      }
    }

    // ✅ Final response
    res.status(200).json({
      message: 'Exam assignment process completed',
      subjectId,
      resultSummary: results,
    });

  } catch (error) {
    console.error('🔥 Bulk add exam error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



router.post('/assign-set', async (req, res) => {
  try {
    const { subjectId, set, studentIds } = req.body;

    if (!subjectId || !set || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        message: 'subjectId, set, and studentIds[] are required',
      });
    }

    const updatedStudents = [];

    for (const studentId of studentIds) {
      const student = await Student.findOne({ studentId });
      if (!student) {
        continue; // Skip if student not found
      }

      const exam = student.exams.find(e => e.subjectId === subjectId);
      if (!exam) {
        continue; // Skip if exam for subject not found
      }

      exam.set = set; // ✅ Assign set

      await student.save();
      updatedStudents.push({ studentId: student.studentId, setAssigned: set });
    }

    if (updatedStudents.length === 0) {
      return res.status(404).json({ message: 'No matching students or exams found to update.' });
    }

    res.status(200).json({
      message: `Set assigned to ${updatedStudents.length} students`,
      updated: updatedStudents,
    });

  } catch (err) {
    console.error('Error assigning set:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
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

    const studentExam = student.exams.find(e => e.subjectId === subjectId);
    if (!studentExam) {
      return res.status(400).json({ message: `No exam found for subject ${subjectId}` });
    }

    if (studentExam.status === 'submitted') {
      return res.status(400).json({ message: `Exam for subject ${subjectId} already submitted` });
    }

    const examData = await ExamQuestion.findOne({ subjectId });
    if (!examData) {
      return res.status(404).json({ message: 'No questions found for this subject' });
    }

    const studentSet = studentExam.set;
    if (!studentSet) {
      return res.status(400).json({ message: 'Set not assigned to this student for this subject' });
    }

    // ✅ Filter questions by student's set
    const questionsForSet = examData.questions.filter(q => q.set === studentSet);

    // Map questions by ID for quick lookup
    const questionMap = {};
    for (const q of questionsForSet) {
      questionMap[q.questionId] = q;
    }

    const updatedAnswers = [];
    let totalScore = 0;

    for (const answer of selectedAnswers) {
      const { questionId, selectedAnswerId } = answer;
      const question = questionMap[questionId];

      if (!question) {
        return res.status(400).json({ message: `Invalid or non-matching questionId: ${questionId} for set: ${studentSet}` });
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

    // Calculate total possible score from the set only
    const totalPossibleScore = questionsForSet.reduce((sum, q) => sum + q.score, 0);

    // Update exam
    studentExam.selectedAnswers = updatedAnswers;
    studentExam.examStartTime = studentExam.examStartTime || new Date();
    studentExam.examEndTime = new Date();
    studentExam.status = 'submitted';
    studentExam.score = totalScore;
    studentExam.totalScore = totalPossibleScore;

    await student.save();

    res.status(200).json({
      message: 'Exam submitted successfully',
      studentId: student.studentId,
      subjectId,
      set: studentSet,
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

// GET /students/basic
router.get('/basic', async (req, res) => {
  try {
    const students = await Student.find({}, {
      studentId: 1,
      name: 1,
      email: 1,
      phone: 1,
      rollNo: 1,
      departmentId: 1,
      class: 1,
      _id: 0
    });

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /students/basic/filter?departmentId=DEP-123456&class=FY
router.get('/basic/filter', async (req, res) => {
  try {
    const { departmentId, class: className } = req.query;

    if (!departmentId || !className) {
      return res.status(400).json({ message: 'departmentId and class are required' });
    }

    const students = await Student.find(
      { departmentId, class: className },
      {
        studentId: 1,
        name: 1,
        email: 1,
        phone: 1,
        rollNo: 1,
        departmentId: 1,
        class: 1,
        _id: 0
      }
    );

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// GET /students/full/filter?departmentId=DEP-123456&class=FY
router.get('/full/filter', async (req, res) => {
  try {
    const { departmentId, class: className } = req.query;

    if (!departmentId || !className) {
      return res.status(400).json({ message: 'departmentId and class are required' });
    }

    const students = await Student.find({ departmentId, class: className });

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /students/full/by-subject?departmentId=DEP-123456&class=FY&subjectId=SUB-999999
router.get('/full/by-subject', async (req, res) => {
  try {
    const { departmentId, class: className, subjectId } = req.query;

    if (!departmentId || !className || !subjectId) {
      return res.status(400).json({ message: 'departmentId, class, and subjectId are required' });
    }

    const students = await Student.find({
      departmentId,
      class: className,
      exams: { $elemMatch: { subjectId } }
    });

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



module.exports = router;
