const express = require('express');
const connection = require('./database');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');
const jwtSecret = 'DBDSW-Token-410';
const PDFDocumentKit = require('pdfkit');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(path.join(__dirname, 'tmp'))) {
  fs.mkdirSync(path.join(__dirname, 'tmp'));
}

// Serve the contents of the public folder  
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

const bcrypt = require('bcrypt');

app.post('/api/users', async (req, res) => {
  const { name, password, type } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const query = 'INSERT INTO users (name, password, type) VALUES (?, ?, ?)';
    console.log(query);
    connection.query(query, [name, hashedPassword, type], (error, results) => {
      if (error) {
        console.error('Database insert error:', error);
        return res.status(500).json({ error: 'Error adding user', details: error });
      }
      res.status(201).json({ message: 'User added successfully', userId: results.insertId });
    });
  } catch (error) {
    console.error('Hashing error:', error);
    return res.status(500).json({ error: 'Error adding user', details: error });
  }
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

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  console.log('Attempting login for username:', username);

  const query = 'SELECT * FROM users WHERE name = ?';

  connection.query(query, [username], (err, results) => {
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
      const token = jwt.sign({ username: user.username, type: user.type }, jwtSecret, { expiresIn: '1h' });
      console.log('Login successful for username:', username);
      res.json({ message: 'Login successful', token, userType: user.type });
    });
  });
});
app.post('/analyze', (req, res) => {
  const { code } = req.body;
  console.log(req.headers);

  runFlawfinderAndGeneratePDF(code, req.headers.name, (error, pdfPath) => {
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
app.get('/report', (req, res) => {
      res.download("./report.pdf", 'report.pdf', (err) => {
          if (err) {
              console.error('Error sending file:', err);
          }
      });
  });

function runFlawfinderAndGeneratePDF(code, filename, callback) {
    const codeFilePath = './uploads/'+filename; // Path to save uploaded code
    fs.writeFileSync(codeFilePath, code);

    // Run Flawfinder on the uploaded code
    exec(`flawfinder ${codeFilePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing Flawfinder:', stderr);
            return callback(new Error('Flawfinder execution failed'));
        }
        fs.unlinkSync(codeFilePath);

        // Create a PDF document
        const pdfPath = './tmp/analysis_report.pdf'; // Path to save the PDF
        const doc = new PDFDocumentKit();
        const writeStream = fs.createWriteStream(pdfPath);

        // Pipe the PDF document to the write stream
        doc.pipe(writeStream);
        doc.fontSize(16).text('Flawfinder Analysis Report', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(stdout); // Output from Flawfinder
        doc.end();
        writeStream.on('finish', async () => {
          if(fs.existsSync('./report.pdf')){
                console.log('PDF created successfully at', pdfPath);
    
                const outputPDFPath = './report.pdf'; // Output path for the merged PDF
                const mergedDoc = await PDFDocument.create(); // Create a new PDFDocument to merge into
                console.log(mergedDoc);
                // Load the first PDF (analysis report)
                const pdf1Bytes = fs.readFileSync('./report.pdf');
                const pdf1 = await PDFDocument.load(pdf1Bytes);
                const pages1 = await mergedDoc.copyPages(pdf1, pdf1.getPageIndices());
                pages1.forEach((page) => mergedDoc.addPage(page));
    
                // Load the second PDF (report.pdf)
                const pdf2Bytes = fs.readFileSync(pdfPath);
                const pdf2 = await PDFDocument.load(pdf2Bytes);
                const pages2 = await mergedDoc.copyPages(pdf2, pdf2.getPageIndices());
                pages2.forEach((page) => mergedDoc.addPage(page));
    
                // Save the merged PDF
                const mergedPdfBytes = await mergedDoc.save();
                fs.writeFileSync(outputPDFPath, mergedPdfBytes);
                console.log('PDFs merged successfully into', outputPDFPath);
                callback(null, pdfPath); // Return the path of the merged PDF
          }
          else{
            console.log("does not exists!");
            const report = new PDFDocumentKit();
            const reportstream = fs.createWriteStream('./report.pdf');
            report.pipe(reportstream);
            report.fontSize(20).text('Full System Report', { underline: true });
            report.end();
            console.log('PDF created successfully at', pdfPath);
            reportstream.on('finish', async () => {
    
                const outputPDFPath = './report.pdf'; // Output path for the merged PDF
                const mergedDoc = await PDFDocument.create(); // Create a new PDFDocument to merge into
                console.log(mergedDoc);
                // Load the first PDF (analysis report)
                const pdf1Bytes = fs.readFileSync('./report.pdf');
                const pdf1 = await PDFDocument.load(pdf1Bytes);
                const pages1 = await mergedDoc.copyPages(pdf1, pdf1.getPageIndices());
                pages1.forEach((page) => mergedDoc.addPage(page));
    
                // Load the second PDF (report.pdf)
                const pdf2Bytes = fs.readFileSync(pdfPath);
                const pdf2 = await PDFDocument.load(pdf2Bytes);
                const pages2 = await mergedDoc.copyPages(pdf2, pdf2.getPageIndices());
                pages2.forEach((page) => mergedDoc.addPage(page));
    
                // Save the merged PDF
                const mergedPdfBytes = await mergedDoc.save();
                fs.writeFileSync(outputPDFPath, mergedPdfBytes);
                console.log('PDFs merged successfully into', outputPDFPath);
                callback(null, pdfPath); // Return the path of the merged PDF
            });
          }
          writeStream.on('error', (err) => {
            console.error('Error writing PDF:', err); // Log any errors
            callback(new Error('Failed to create PDF'));
          });
        });

        // Listen for the finish event to confirm PDF creation
        
    });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
