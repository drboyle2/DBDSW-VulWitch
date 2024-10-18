const express = require('express');
const connection = require('./database');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve the index.html file
app.use(express.static(path.join(__dirname, 'Public')));

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

app.post('/api/users', (req, res) => {
  const { name, email, password, type } = req.body; // Include the new field here

  // Basic validation
  if (!name || !email || !password) { // Check if age is provided
      return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // SQL query to insert the new user
  const query = 'INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)';
  connection.query(query, [name, email, password, type], (error, results) => {
      if (error) {
          console.error('Database insert error:', error);
          return res.status(500).json({ error: 'Error adding user', details: error });
      }
      res.status(201).json({ message: 'User added successfully', userId: results.insertId });
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use the uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB (optional)
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|txt|py|java|c|cpp/; // Allowed file types
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('File type not allowed')); // Reject if file type is not allowed
  },
});

// Function to run flawfinder.py
function runFlawfinder(filePath, callback) {
  // Construct the command to call Flawfinder directly
  const command = `flawfinder "${filePath}"`; // Use the appropriate command if needed (e.g., flawfinder.py if it's a Python script)

  console.log(`Executing command: ${command}`); // Log the command being executed

  exec(command, (error, stdout, stderr) => {
      if (error) {
          console.error('Command execution error:', stderr);
          return callback(`Flawfinder error: ${stderr}`, null);
      }

      // Log the output from Flawfinder
      console.log('Flawfinder output:', stdout);
      callback(null, stdout);
  });
}

// Endpoint to handle file uploads and run flawfinder
app.post('/flawfind', upload.single('file'), (req, res) => {
  console.log("Attempted upload!", req.file); // Log the uploaded file information
  if (!req.file) {
      return res.status(400).send({ error: 'No file uploaded' });
  }
  const filePath = path.join(uploadsDir, req.file.filename);

  runFlawfinder(filePath, (error, result) => {
      try {
          fs.unlinkSync(filePath); // Delete the file after processing
      } catch (err) {
          console.error('Error deleting file:', err);
      }

      if (error) {
          console.error('Flawfinder processing error:', error);
          return res.status(500).send({ error: error });
      }
      res.json({ result: result });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
