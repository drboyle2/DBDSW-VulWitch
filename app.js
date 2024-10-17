const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRoutes = require('./userRoutes');

const app = express();
const port = 3000;

// Secret key for JWT
const jwtSecret = 'DBDSW-Token-410';

// Set up middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'Public' directory
app.use(express.static(path.join(__dirname, 'Public')));

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/index.html'));
});

// Use user routes
app.use('/api', userRoutes);

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  console.log('Attempting login for username:', username);

  const query = 'SELECT * FROM users WHERE username = ?';

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error fetching user from database:', err);
      return res.status(500).send('Error fetching user');
    }

    console.log('Database query result:', results);

    if (results.length === 0) {
      console.warn('No user found with username:', username);
      return res.status(401).send('Invalid username or password');
    }

    const user = results[0];
    console.log('User found:', user);

    // Log the passwords being compared
    console.log('Provided password:', password);
    console.log('Stored hashed password:', user.password);

    // Compare the provided password with the stored hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).send('Error verifying user');
      }

      if (!isMatch) {
        console.warn('Password does not match for username:', username);
        return res.status(401).send('Invalid username or password');
      }

      // Generate a JWT token
      const token = jwt.sign({ username: user.username }, jwtSecret, { expiresIn: '1h' });
      console.log('Login successful for username:', username);
      res.json({ message: 'Login successful', token });
    });
  });
});

// Add User Endpoint
app.post('/add-user', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  // Hash password
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
      res.status(200).send('User added successfully!');
    });
  });
});

// START SERVER DONT TOUCH
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
