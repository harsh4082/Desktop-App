const express = require('express');
const router = express.Router();
const ExamQuestion = require('../models/ExamQuestion');

// POST /api/exams/create
router.post('/create', async (req, res) => {
    try {
      const { subjectId, class: className } = req.body;
  
      if (!subjectId || !className) {
        return res.status(400).json({ error: 'subjectId and class are required' });
      }
  
      const exam = new ExamQuestion({
        subjectId,
        class: className,
        questions: [],
        totalQuestions: 0
      });
  
      await exam.save();
      res.status(201).json({ message: 'Exam created', exam });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// PUT /api/exams/add-questions/:examId
router.put('/add-questions/:examId', async (req, res) => {
    try {
      const { questions } = req.body;
      const { examId } = req.params;
  
      const exam = await ExamQuestion.findOne({ examId });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });
  
      const existingQuestions = exam.questions || [];
  
      // 🔹 Group existing questions by set to determine last index per set
      const setIndexMap = {};
      existingQuestions.forEach(q => {
        if (!setIndexMap[q.set]) {
          setIndexMap[q.set] = 1;
        }
        setIndexMap[q.set] = Math.max(setIndexMap[q.set], q.setIndex || 0);
      });
  
      // 🔹 Prepare new questions with updated setIndex and answerOptions (A-D)
      const newQuestions = questions.map(q => {
        const set = q.set;
        if (!setIndexMap[set]) setIndexMap[set] = 0;
        setIndexMap[set] += 1;
  
        const answerOptions = q.answerOptions?.map((opt, i) => ({
          id: String.fromCharCode(65 + i), // "A", "B", "C", ...
          text: opt.text
        }));
  
        return {
          questionText: q.questionText,
          answerOptions,
          correctAnswerId: q.correctAnswerId,
          score: q.score || 1,
          set,
          setIndex: setIndexMap[set] // ✅ Assign next index for this set
        };
      });
  
      // 🔹 Add new questions and save
      exam.questions.push(...newQuestions);
      exam.totalQuestions = exam.questions.length;
  
      await exam.save();
      res.status(200).json({ message: 'Questions added', questions: exam.questions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  

// PATCH /api/exams/update-question/:examId/:questionId
router.patch('/update-question/:examId/:questionId', async (req, res) => {
    try {
      const { examId, questionId } = req.params;
      const { questionText, answerOptions, correctAnswerId, score, set } = req.body;
  
      const exam = await ExamQuestion.findOne({ examId });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });
  
      const question = exam.questions.find(q => q.questionId === questionId);
      if (!question) return res.status(404).json({ error: 'Question not found' });
  
      if (questionText) question.questionText = questionText;
      if (Array.isArray(answerOptions)) {
        question.answerOptions = answerOptions.map((opt, idx) => ({
          id: opt.id || String.fromCharCode(65 + idx),
          text: opt.text
        }));
      }
      if (correctAnswerId) question.correctAnswerId = correctAnswerId;
      if (score !== undefined) question.score = score;
      if (set) question.set = set;
  
      await exam.save();
      res.status(200).json({ message: 'Question updated successfully', question });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

//Get All exams
router.get('/all', async (req, res) => {
    try {
      const exams = await ExamQuestion.find();
      res.status(200).json(exams);
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

//Fetch exams by subjectId
router.get('/subject/:subjectId', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const exams = await ExamQuestion.find({ subjectId });
      res.status(200).json(exams);
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

//Fetch exam questions by examId
router.get('/questions/:examId', async (req, res) => {
    try {
      const { examId } = req.params;
      const exam = await ExamQuestion.findOne({ examId });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });
      res.status(200).json({ questions: exam.questions });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  
// Fetch all questions by subjectId
router.get('/questions/subject/:subjectId', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const exams = await ExamQuestion.find({ subjectId });
  
      if (!exams || exams.length === 0) {
        return res.status(404).json({ error: 'No exams found for this subject' });
      }
  
      // Combine questions from all exams under the same subject
      const allQuestions = exams.flatMap(exam => exam.questions);
  
      res.status(200).json({ subjectId, totalQuestions: allQuestions.length, questions: allQuestions });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});


//Fetch set-wise questions for an exam 
router.get('/questions/:examId/set/:set', async (req, res) => {
    try {
      const { examId, set } = req.params;
      const exam = await ExamQuestion.findOne({ examId });
      if (!exam) return res.status(404).json({ error: 'Exam not found' });
  
      const filteredQuestions = exam.questions.filter(q => q.set === set);
      res.status(200).json({ set, questions: filteredQuestions });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  
// Fetch questions set-wise by subjectId            
router.get('/questions/subject/:subjectId/set/:set', async (req, res) => {
    try {
      const { subjectId, set } = req.params;
      const exams = await ExamQuestion.find({ subjectId });
  
      if (!exams || exams.length === 0) {
        return res.status(404).json({ error: 'No exams found for this subject' });
      }
  
      // Filter and combine all questions by set
      let setWiseQuestions = exams.flatMap(exam =>
        exam.questions.filter(q => q.set === set)
      );
  
      // 🔽 Sort by setIndex (ascending numeric order)
      setWiseQuestions.sort((a, b) => (a.setIndex || 0) - (b.setIndex || 0));
  
      res.status(200).json({
        subjectId,
        set,
        totalQuestions: setWiseQuestions.length,
        questions: setWiseQuestions
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  

// GET all distinct sets and their question counts for a given subjectId
router.get('/questions/subject/:subjectId/sets', async (req, res) => {
    try {
      const { subjectId } = req.params;
  
      const exams = await ExamQuestion.find({ subjectId });
  
      if (!exams || exams.length === 0) {
        return res.status(404).json({ error: 'No exams found for this subject' });
      }
  
      // Flatten all questions across exams
      const allQuestions = exams.flatMap(exam => exam.questions);
  
      // Count questions per set
      const setMap = {};
      allQuestions.forEach(q => {
        if (setMap[q.set]) {
          setMap[q.set]++;
        } else {
          setMap[q.set] = 1;
        }
      });
  
      // Convert object to array format
      const setSummary = Object.entries(setMap).map(([set, count]) => ({
        set,
        count
      }));
  
      res.status(200).json({ subjectId, totalSets: setSummary.length, sets: setSummary });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

  
  
  
  
module.exports = router;
