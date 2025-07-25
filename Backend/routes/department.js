// routes/department.js
const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Create Department
router.post('/create', async (req, res) => {
  try {
    const { name, hod, classes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const existing = await Department.findOne({ name });
    if (existing) return res.status(409).json({ error: 'Department already exists' });

    const newDepartment = new Department({ name, hod, classes });
    await newDepartment.save();

    res.status(201).json({ message: 'Department created', department: newDepartment });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update Department
router.put('/update/:departmentId', async (req, res) => {
  try {
    const { name, hod, classes } = req.body;

    const department = await Department.findOne({ departmentId: req.params.departmentId });
    if (!department) return res.status(404).json({ error: 'Department not found' });

    if (name) department.name = name;
    if (hod) department.hod = hod;
    if (classes) department.classes = classes;

    await department.save();
    res.status(200).json({ message: 'Department updated', department });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Add new class(es) to department
router.post('/add-class/:departmentId', async (req, res) => {
    try {
      const { classes } = req.body; // Expecting array of classes
  
      if (!Array.isArray(classes) || classes.length === 0) {
        return res.status(400).json({ error: 'Please provide at least one class to add' });
      }
  
      const department = await Department.findOne({ departmentId: req.params.departmentId });
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
  
      // Prevent duplicate class names
      const existingClassNames = department.classes.map(cls => cls.name.toLowerCase());
  
      classes.forEach(newClass => {
        if (!existingClassNames.includes(newClass.name.toLowerCase())) {
          department.classes.push(newClass);
        }
      });
  
      await department.save();
      res.status(200).json({ message: 'Class(es) added successfully', department });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// GET /api/department/all
router.get('/all', async (req, res) => {
    try {
      const departments = await Department.find();
      res.status(200).json(departments);
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});
  
// GET /api/department/names
router.get('/names', async (req, res) => {
    try {
      const departments = await Department.find({}, { _id: 0, departmentId: 1, name: 1 });
      res.status(200).json(departments);
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// GET /api/department/classes/:departmentId
router.get('/classes/:departmentId', async (req, res) => {
    try {
      const department = await Department.findOne(
        { departmentId: req.params.departmentId },
        { _id: 0, classes: 1 }
      );
  
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
  
      res.status(200).json(department.classes);
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});


module.exports = router;
