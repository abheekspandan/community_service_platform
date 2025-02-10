// src/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Adjust the path if necessary

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State to handle loading status
  const [error, setError] = useState(''); // State to handle error messages

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true during the fetch operation
    setError(''); // Reset error message

    try {
      const response = await fetch('http://localhost:3002/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Send both email and password to backend
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if token and user data are received
        if (data.token && data.user) {
          login(data.token, data.user); // Call login with token and user data
          navigate('/mainpage'); // Redirect to main page after successful login
        } else {
          setError('Login failed. Token or user data is missing.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message if present */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <p>
        <Link to="/forgot-password">Forgot Password?</Link> {/* Add link to Forgot Password */}
      </p>
      <button type="submit" disabled={loading} id='apply_margin'> {/* Disable button while loading */}
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </form>
  );
};

export default Login;

