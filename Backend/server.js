const express = require('express');
const app = express();
const PORT = 3000;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server' });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
