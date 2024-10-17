const express = require('express');
const connection = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/Public/index.html'));
});

// Example API endpoint: Get all users from the 'users' table
app.get('/api/users', (req, res) => {
  connection.query('SELECT * FROM users', (error, results, fields) => {
    if (error) {
      res.status(500).send('Error retrieving users from database');
      return;
    }
    res.json(results);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});