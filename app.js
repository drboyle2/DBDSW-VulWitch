const express = require('express');
const connection = require('./database');

const app = express();

app.get('/', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});