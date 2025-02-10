const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise'); // Use the promise-based library
const nodemailer = require('nodemailer');
const app = express();
const twilio = require('twilio'); // Import the Twilio module


require('dotenv').config();
// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Barman@2002',
  database: 'hostel',
};

let db;

(async () => {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');
  } catch (err) {
    console.error('Database connection failed:', err.stack);
  }
})();

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Function to get user by ID
async function getUserById(userId) {
  const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  return user[0]; // Return the first user found or undefined if none found
}

// Issues section
app.get('/issues/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const [results] = await db.query('SELECT * FROM issues WHERE user_id = ?', [userId]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).send('Server error');
  }
});

// Delete an issue by ID
app.delete('/issues/:id', async (req, res) => {
  const { id } = req.params; 
  const userId = req.body.userId;

  console.log('Deleting issue ID:', id, 'for user ID:', userId); // Log the IDs

  try {
    const [issue] = await db.query('SELECT * FROM issues WHERE id = ? AND user_id = ?', [id, userId]);

    if (!issue.length) {
      return res.status(404).json({ message: 'Issue not found or does not belong to the user.' });
    }

    await db.query('DELETE FROM issues WHERE id = ?', [id]);
    res.json({ message: 'Issue deleted successfully!' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'An error occurred while deleting the issue.' });
  }
});

// Update checkbox status
app.patch('/issues/:id/checkbox', async (req, res) => {
  const { userId, isChecked } = req.body;

  try {
    // Fetch the user based on userId
    const [userResult] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    
    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult[0];
    
    // Check if the user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can modify the checkbox.' });
    }

    // Update the checkbox status
    await db.query('UPDATE issues SET is_checked = ? WHERE id = ?', [isChecked, req.params.id]);

    // If checked, schedule deletion after 30 seconds
    if (isChecked) {
      const issueId = req.params.id;

      // Store the timeout ID to allow cancellation if needed
      if (!global.deleteTimers) global.deleteTimers = {};
      if (global.deleteTimers[issueId]) clearTimeout(global.deleteTimers[issueId]); // Clear any existing timer

      global.deleteTimers[issueId] = setTimeout(async () => {
        try {
          await db.query('DELETE FROM issues WHERE id = ?', [issueId]);
          console.log(`Issue ${issueId} deleted after 30 seconds.`);
        } catch (error) {
          console.error('Error deleting issue:', error);
        }
      }, 30000); // 30 seconds
    } else {
      // If unchecked, cancel the scheduled deletion
      if (global.deleteTimers && global.deleteTimers[req.params.id]) {
        clearTimeout(global.deleteTimers[req.params.id]);
        delete global.deleteTimers[req.params.id];
      }
    }

    res.json({ message: 'Checkbox updated successfully' });
  } catch (error) {
    console.error('Error updating checkbox:', error);
    res.status(500).json({ message: 'Error updating checkbox' });
  }
});




// Get all issues sorted by votes in descending order
app.get('/issues', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT issues.*, users.first_name, users.last_name 
      FROM issues 
      JOIN users ON issues.user_id = users.id 
      ORDER BY issues.votes DESC, issues.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    console.error('Error fetching issues:', err);
    return res.status(500).send('Error fetching issues');
  }
});


//save a new issue as draft
app.post('/issues', async (req, res) => {
  const { userId, title, description, status } = req.body;

  try {
    await db.query(
      'INSERT INTO issues (user_id, title, description, status) VALUES (?, ?, ?, ?)',
      [userId, title, description, status || 'draft']
    );
    res.status(200).json({ message: 'Issue saved successfully' });
  } catch (error) {
    console.error('Error saving issue:', error);
    res.status(500).json({ message: 'Error saving issue' });
  }
});

// Publish a draft
// Endpoint to publish a draft issue
app.post('/issues/publish/:issueId', async (req, res) => {
  const { issueId } = req.params;
  const userId = req.body.userId; // Assuming userId is sent in the body

  try {
    // Check if the issue belongs to the logged-in user
    const [issue] = await db.query('SELECT * FROM issues WHERE id = ? AND user_id = ?', [issueId, userId]);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found or does not belong to the user.' });
    }

    // Update the issue's status to 'published'
    await db.query('UPDATE issues SET status = ? WHERE id = ?', ['published', issueId]);

    res.json({ message: 'Issue published successfully!' });
  } catch (error) {
    console.error('Error publishing issue:', error);
    res.status(500).json({ message: 'An error occurred while publishing the issue.' });
  }
});


app.post('/vote/:issueId', async (req, res) => {
  const { userId } = req.body;
  const { issueId } = req.params;

  if (!userId || !issueId) {
    return res.status(400).json({ message: 'User ID and Issue ID are required.' });
  }

  try {
    // Check if the user has already voted
    const checkQuery = 'SELECT * FROM votes WHERE user_id = ? AND issue_id = ?';
    const [existingVote] = await db.query(checkQuery, [userId, issueId]);

    if (existingVote.length > 0) {
      // If vote exists, remove it (cancel vote)
      const deleteVoteQuery = 'DELETE FROM votes WHERE user_id = ? AND issue_id = ?';
      await db.query(deleteVoteQuery, [userId, issueId]);

      // Decrease vote count in the issues table
      const updateVotesQuery = 'UPDATE issues SET votes = votes - 1 WHERE id = ?';
      await db.query(updateVotesQuery, [issueId]);

      return res.status(200).json({ message: 'Vote removed successfully!', voteStatus: 'removed' });
    } else {
      // If no vote exists, insert a new vote
      const insertQuery = 'INSERT INTO votes (user_id, issue_id) VALUES (?, ?)';
      await db.query(insertQuery, [userId, issueId]);

      // Increase vote count in the issues table
      const updateVotesQuery = 'UPDATE issues SET votes = votes + 1 WHERE id = ?';
      await db.query(updateVotesQuery, [issueId]);

      return res.status(200).json({ message: 'Vote cast successfully!', voteStatus: 'casted' });
    }
  } catch (error) {
    console.error('Error handling vote:', error);
    res.status(500).json({ message: 'An error occurred while processing the vote.' });
  }
});






// Fetch voted issues by user ID
app.get('/votes/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [results] = await db.query('SELECT issue_id FROM votes WHERE user_id = ?', [userId]);
    res.json(results); // Send the results back to the frontend
  } catch (err) {
    console.error('Error fetching voted issues:', err);
    return res.status(500).send('Server error');
  }
});

// Register user
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, contactNumber, password } = req.body;

  try {
    // Check if the user already exists
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    await db.query('INSERT INTO users (first_name, last_name, email, contact_number, password) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, email, contactNumber, hashedPassword]);
    res.status(201).json({ message: 'User created successfully.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Fetch user data by ID
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log("Fetched user from DB:", user[0]); // Log fetched data
    res.json(user[0]); // Send the user data as the response
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});


// Update user data
app.put('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, contactNumber } = req.body;
  try {
    await db.query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, contact_number = ? WHERE id = ?',
      [firstName, lastName, email, contactNumber, id]
    );
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});


app.post('/api/verify-password', async (req, res) => {
  const { userId, currentPassword } = req.body;

  // Fetch the user from the database
  const user = await getUserById(userId); // Implement this function to get user details from the database
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Compare the hashed current password with the stored password
  const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password); // Assuming you store hashed passwords
  
  if (isPasswordCorrect) {
    res.json({ verified: true });
  } else {
    res.json({ verified: false });
  }
});

const dbPromise = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
// Example of backend logic in Node.js (Express) for resetting the password

app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  // Validate email and password
  if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).send('Email and password are required, and password must be at least 6 characters long');
  }
      // Hash the new password before saving it
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password in the database
      db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      console.log('password updated');
});


app.post('/api/reset-password', async (req, res) => {

      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
          return res.status(400).json({ message: 'User ID and new password are required' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log('Hashed password:', hashedPassword);

      console.log('Updating password for user ID:', userId);

      // Ensure the query executes before sending a response
      db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
      console.log("password updated");
});





// Endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
  let { contactNumber } = req.body;

  try {
      // Ensure the phone number is in E.164 format
      if (!contactNumber.startsWith('+')) {
          contactNumber = `+91${contactNumber}`;  // Change `+91` to your country code
      }

      await client.verify.v2.services(serviceSid)
          .verifications.create({ to: contactNumber, channel: 'sms' });

      res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Reset password logic
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token
const client = twilio(accountSid, authToken);
const serviceSid = process.env.TWILIO_SERVICE_SID; // Your Verify Service SID

// Endpoint to fetch contact number and send OTP
app.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // Fetch the contact number from the database using the email
    const query = 'SELECT contact_number FROM users WHERE email = ?'; // Update to match your table and field names
    const [results] = await db.execute(query, [email]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No user found with this email.' });
    }

    let contactNumber = results[0].contact_number; // Use let to allow reassignment
    console.log('Contact Number:', contactNumber); // Log the contact number

    // Ensure the phone number is in E.164 format
    if (!contactNumber.startsWith('+')) {
      contactNumber = `+91${contactNumber}`;  // Change `+91` to your country code
    }

    // Send OTP using Twilio
    try {
      await client.verify.services(serviceSid)
        .verifications.create({ to: contactNumber, channel: 'sms' });

      res.status(200).json({ message: 'OTP sent successfully', contactNumber: contactNumber });
    } catch (twilioError) {
      console.error('Twilio Error:', twilioError); // Detailed logging for Twilio errors
      res.status(500).json({ error: 'Failed to send OTP. Please try again later.' });
    }

  } catch (error) {
    console.error('Error sending OTP:', error); // General error logging
    res.status(500).json({ error: 'Failed to process request. Please try again later.' });
  }
});


// Endpoint to verify OTP
app.post('/api/verify-otp', async (req, res) => {
  const { contactNumber, code } = req.body;

  console.log("Received Contact Number:", contactNumber); // Debugging
  console.log("Received Code:", code); // Debugging

  // Clean contact number by removing spaces
  const cleanedContactNumber = contactNumber.replace(/\s+/g, '');

  try {
      const verification_check = await client.verify.v2.services(serviceSid)
          .verificationChecks
          .create({ to: cleanedContactNumber, code: code });

      if (verification_check.status === 'approved') {
          res.status(200).json({ verified: true });
      } else {
          res.status(400).json({ verified: false });
      }
  } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
  }
});



// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query to find the user by email
    const [result] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (result.length === 0) {
      return res.status(404).json({ message: 'No user found' });
    }

    const user = result[0];

    // Check if the password is valid
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token with user ID and role
    const token = jwt.sign(
      { id: user.id, role: user.role }, // Include user role in the token
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return token along with user data
    res.json({
      auth: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        contactNumber: user.contact_number,
        role: user.role // Include role in the user object
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error on the server' });
  }
});

// Delete user by ID
app.delete('/api/delete-account/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Delete votes that reference the user
    await db.query('DELETE FROM votes WHERE user_id = ?', [id]);

    // Now delete the user
    const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Deleted user with ID: ${id}`);
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});





// Listen on port 3002
app.listen(3002, () => {
  console.log('Server running on port 3002');
});
