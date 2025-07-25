// server.js
const express = require('express');
const connectDB = require('./db');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dept', require('./routes/department'));
app.use('/api/subject', require('./routes/subject'));
app.use('/api/exams', require('./routes/examQuestion'));


app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server' });
});

app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});
