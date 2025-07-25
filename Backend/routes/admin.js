// routes/admin.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Add Admin (POST /api/admin/add)
router.post('/add', async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await Admin.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const newAdmin = new Admin({ name, username, password }); // In production, hash password
    await newAdmin.save();

    res.status(201).json({ message: 'Admin created', admin: newAdmin });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Login (POST /api/admin/login)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  if (admin.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.status(200).json({ message: 'Login successful', admin });
});

// Update (PUT /api/admin/update/:id)
router.put('/update/:id', async (req, res) => {
    try {
      const { name, username, password } = req.body;
      
      const admin = await Admin.findOne({ adminId: req.params.id });
      if (!admin) return res.status(404).json({ error: 'Admin not found' });
  
      if (name) admin.name = name;
      if (username) admin.username = username;
      if (password) admin.password = password;
  
      await admin.save();
      res.status(200).json({ message: 'Admin updated', admin });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
});  

module.exports = router;
