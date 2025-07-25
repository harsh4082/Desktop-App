const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// Helper function to calculate total students from sets
const getTotalStudentsFromSets = (sets) => {
    return (sets || []).reduce((sum, set) => sum + (set.students || 0), 0);
};
  

router.post('/create', async (req, res) => {
    try {
      let { name, class: subjectClass, teacherName, departmentId, sets, totalStudents, autoCalculate } = req.body;
  
      // ✅ Check for duplicate set names
      const setNames = sets.map(set => set.name.trim().toLowerCase());
      const hasDuplicateSetNames = new Set(setNames).size !== setNames.length;
  
      if (hasDuplicateSetNames) {
        return res.status(400).json({
          error: 'Duplicate set names are not allowed. Each set must have a unique name.'
        });
      }
  
      // ✅ Check sum of students in sets
      const sumOfSetStudents = getTotalStudentsFromSets(sets);
  
      if (autoCalculate) {
        totalStudents = sumOfSetStudents;
      } else if (sumOfSetStudents !== totalStudents) {
        return res.status(400).json({
          error: `Total students (${totalStudents}) must equal sum of students in all sets (${sumOfSetStudents}).`
        });
      }
  
      const newSubject = new Subject({
        name,
        class: subjectClass,
        teacherName,
        departmentId,
        totalStudents,
        sets
      });
  
      await newSubject.save();
      res.status(201).json({ message: 'Subject created', subject: newSubject });
  
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  
// PUT /api/subject/update/:subjectId
router.put('/update/:subjectId', async (req, res) => {
    try {
      const subject = await Subject.findOne({ subjectId: req.params.subjectId });
      if (!subject) return res.status(404).json({ error: 'Subject not found' });
  
      const {
        name,
        class: subjectClass,
        teacherName,
        departmentId,
        sets,
        totalStudents,
        autoCalculate,
      } = req.body;
  
      // ✅ Validate sets if provided
      if (sets) {
        // ✅ Check for duplicate set names
        const setNames = sets.map((s) => s.name.trim().toLowerCase());
        const hasDuplicateSetNames = new Set(setNames).size !== setNames.length;
        if (hasDuplicateSetNames) {
          return res.status(400).json({
            error: 'Duplicate set names are not allowed. Each set must be unique.',
          });
        }
  
        const sumOfSetStudents = getTotalStudentsFromSets(sets);
  
        // ✅ Handle student count validation
        if (autoCalculate) {
          subject.totalStudents = sumOfSetStudents;
        } else if (totalStudents !== sumOfSetStudents) {
          return res.status(400).json({
            error: `Total students (${totalStudents}) must equal sum of students in sets (${sumOfSetStudents}).`,
          });
        }
  
        subject.sets = sets;
      }
  
      // ✅ If only totalStudents updated without sets
      if (!sets && totalStudents !== undefined) {
        if (!autoCalculate && totalStudents !== subject.sets.reduce((sum, s) => sum + (s.students || 0), 0)) {
          return res.status(400).json({
            error: `Updated totalStudents must match existing sets total.`,
          });
        }
        subject.totalStudents = totalStudents;
      }
  
      // ✅ Update other fields if present
      if (name) subject.name = name;
      if (subjectClass) subject.class = subjectClass;
      if (teacherName) subject.teacherName = teacherName;
      if (departmentId) subject.departmentId = departmentId;
  
      await subject.save();
      res.status(200).json({ message: 'Subject updated successfully', subject });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  


// 3. Update Set Schema by Subject ID
router.put('/update-set/:subjectId', async (req, res) => {
    try {
      const { sets } = req.body;
  
      // Validate sets exist
      if (!Array.isArray(sets) || sets.length === 0) {
        return res.status(400).json({ error: 'Sets are required and must be a non-empty array' });
      }
  
      // Validate unique set names
      const setNames = sets.map(s => s.name.trim());
      const uniqueSetNames = new Set(setNames);
      if (setNames.length !== uniqueSetNames.size) {
        return res.status(400).json({ error: 'Duplicate set names are not allowed' });
      }
  
      const subject = await Subject.findOne({ subjectId: req.params.subjectId });
      if (!subject) return res.status(404).json({ error: 'Subject not found' });
  
      const totalFromSets = getTotalStudentsFromSets(sets);
  
      // Validate sum of set students matches subject total
      if (subject.totalStudents !== totalFromSets) {
        return res.status(400).json({
          error: `Sum of students in sets (${totalFromSets}) must match subject totalStudents (${subject.totalStudents})`
        });
      }
  
      // Update sets
      subject.sets = sets;
      await subject.save();
  
      res.status(200).json({ message: 'Sets updated', sets: subject.sets });
  
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  
  

// 4. Get All Subjects
router.get('/all', async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// 5. Get Subjects by Department ID
router.get('/by-department/:departmentId', async (req, res) => {
  try {
    const subjects = await Subject.find({ departmentId: req.params.departmentId });
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// 6. Get Sets and Students by Subject ID
router.get('/sets/:subjectId', async (req, res) => {
  try {
    const subject = await Subject.findOne({ subjectId: req.params.subjectId });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    res.status(200).json(subject.sets);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// 7. Get Total Students for a Subject
router.get('/total-students/:subjectId', async (req, res) => {
  try {
    const subject = await Subject.findOne({ subjectId: req.params.subjectId });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    res.status(200).json({ totalStudents: subject.totalStudents });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.delete('/delete/:subjectId', async (req, res) => {
    try {
      const deleted = await Subject.findOneAndDelete({ subjectId: req.params.subjectId });
      if (!deleted) return res.status(404).json({ error: 'Subject not found' });
  
      res.status(200).json({ message: 'Subject deleted', subject: deleted });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.post('/add-set/:subjectId', async (req, res) => {
    try {
      const { name, students } = req.body;
      const subject = await Subject.findOne({ subjectId: req.params.subjectId });
      if (!subject) return res.status(404).json({ error: 'Subject not found' });
  
      subject.sets.push({ name, students });
      subject.totalStudents = getTotalStudentsFromSets(subject.sets);
  
      await subject.save();
      res.status(200).json({ message: 'Set added', sets: subject.sets });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  

router.delete('/remove-set/:subjectId/:setName', async (req, res) => {
    try {
      const { subjectId, setName } = req.params;
      const subject = await Subject.findOne({ subjectId });
  
      if (!subject) return res.status(404).json({ error: 'Subject not found' });
  
      if (subject.sets.length === 1) {
        return res.status(400).json({
          error: 'Cannot delete the only remaining set.'
        });
      }
  
      const deletedSetIndex = subject.sets.findIndex(
        set => set.name.toLowerCase() === setName.toLowerCase()
      );
  
      if (deletedSetIndex === -1) {
        return res.status(404).json({ error: `Set "${setName}" not found` });
      }
  
      const deletedSet = subject.sets[deletedSetIndex];
      const deletedStudents = deletedSet.students || 0;
  
      // Remove the set
      subject.sets.splice(deletedSetIndex, 1);
  
      const remainingSets = subject.sets.length;
  
      if (remainingSets === 1) {
        // Just add all to the only one left
        subject.sets[0].students += deletedStudents;
      } else {
        // Distribute fairly across all sets
        const base = Math.floor(deletedStudents / remainingSets);
        let extra = deletedStudents % remainingSets;
  
        subject.sets = subject.sets.map(set => {
          const add = base + (extra > 0 ? 1 : 0);
          extra--;
          return {
            ...set.toObject(),
            students: (set.students || 0) + add
          };
        });
      }
  
      // Rename to Set 1, Set 2, ...
      subject.sets = subject.sets.map((set, idx) => ({
        ...set,
        name: `Set ${idx + 1}`
      }));
  
      subject.totalStudents = getTotalStudentsFromSets(subject.sets);
  
      await subject.save();
  
      res.status(200).json({
        message: `Set "${setName}" deleted and students redistributed.`,
        sets: subject.sets,
        totalStudents: subject.totalStudents
      });
  
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  
  
  
  

module.exports = router;
