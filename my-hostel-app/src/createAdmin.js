// Import necessary modules
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

// Database connection
const db = mysql.createPool({
  host: 'localhost',      // Update this with your MySQL host
  user: 'root',           // Update with your MySQL user
  password: 'Barman@2002',   // Update with your MySQL password
  database: 'hostel',  // Update with your MySQL database name
});

// Function to create the admin user
const createAdminUser = async () => {
    const firstName = 'Admin';
    const lastName = 'User';
    const email = 'admin@example.com';
    const contactNumber = '+9411390251';  // Update with your contact number
    const password = 'password';          // Update to your desired admin password
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
  
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, contact_number, password, role) 
      VALUES (?, ?, ?, ?, ?, 'admin')
    `;
  
    try {
      // Execute the query to insert the admin user
      await db.query(insertQuery, [firstName, lastName, email, contactNumber, hashedPassword]);
      console.log('Admin user created successfully!');
    } catch (error) {
      console.error('Error creating admin user:', error);
    } finally {
      db.end();  // Close the database connection
    }
  };
  
  // Call the function to create the admin user
  createAdminUser();