const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'dbdsw-db.czmww6q4wkst.us-east-2.rds.amazonaws.com',  // Replace with your RDS endpoint
  user: 'admin',                                               // Replace with your RDS master username
  password: 'b1yjbqj6BWvA6Od',                                   // Replace with your RDS password
  database: 'DBDSWVulwitch'                              // Replace with the database name you're using
});

// Connect to the database
connection.connect(error => {
  if (error) {
    console.error('Error connecting to the database:', error.stack);
    return;
  }
  console.log('Connected to AWS RDS MySQL database as ID ' + connection.threadId);
});

module.exports = connection;






// mysql -h dbdsw-db.czmww6q4wkst.us-east-2.rds.amazonaws.com -u admin -p
// b1yjbqj6BWvA6Od

