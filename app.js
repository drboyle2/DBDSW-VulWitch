const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRoutes = require('./userRoutes');
const fs = require('fs');
const { exec } = require('child_process');
const PDFDocument = require('pdfkit');


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

  const query = 'SELECT * FROM users WHERE name = ?';

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

app.post('/analyze', (req, res) => {
  const { code } = req.body;

  runFlawfinderAndGeneratePDF(code, (error, pdfPath) => {
      if (error) {
          return res.status(500).send('Error creating PDF: ' + error.message);
      }

      // Send the generated PDF file
      res.download(pdfPath, 'analysis_report.pdf', (err) => {
          if (err) {
              console.error('Error sending file:', err);
          }
          // Optionally, delete the file after sending it
          fs.unlink(pdfPath, (err) => {
              if (err) console.error('Error deleting file:', err);
          });
      });
  });
});

function runFlawfinderAndGeneratePDF(code, callback) {
    const codeFilePath = '/tmp/uploaded_code.c'; // Path to save uploaded code
    fs.writeFileSync(codeFilePath, code);

    // Run Flawfinder on the uploaded code
    exec(`flawfinder ${codeFilePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing Flawfinder:', stderr);
            return callback(new Error('Flawfinder execution failed'));
        }

        // Create a PDF document
        const pdfPath = '/tmp/analysis_report.pdf'; // Path to save the PDF
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(pdfPath);

        // Pipe the PDF document to the write stream
        doc.pipe(writeStream);
        doc.fontSize(16).text('Flawfinder Analysis Report', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(stdout); // Output from Flawfinder
        doc.end();

        // Listen for the finish event to confirm PDF creation
        writeStream.on('finish', () => {
            console.log('PDF created successfully at', pdfPath); // Confirm PDF creation
            callback(null, pdfPath);
        });

        writeStream.on('error', (err) => {
            console.error('Error writing PDF:', err); // Log any errors
            callback(new Error('Failed to create PDF'));
        });
    });
}



// START SERVER DONT TOUCH
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
