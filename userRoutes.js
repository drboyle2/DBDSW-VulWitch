const express = require('express');
const router = express.Router();
const db = require('./database');
const verifyToken = require('./verifyToken');

// Add User
router.post('/add-user', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }
  console.log('Attempting to add user with username:', username);
  //Hash Password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).send('Error adding user');
    }

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';

    db.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error adding user to database:', err);
        res.status(500).send('Error adding user');
        return;
      }
      console.log('User added successfully with username:', username);
      res.status(200).send('User added successfully!');
    });
  });
});


module.exports = router;
