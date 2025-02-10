import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
// import { AuthProvider } from './AuthContext';  // Ensure the path is correct
import './VerifyOtp.css'; // Import the CSS file

const ForgotPassword = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activeForm, setActiveForm] = useState('request');
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const [otpSent, setOtpSent] = useState(false); // State for OTP sent status
  const [otpVerified, setOtpVerified] = useState(false); // State for OTP verification status

  // Function to handle sending OTP
  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true); // Set loading to true
    console.log(user);  // Ensure user object is being populated


    axios.post('http://localhost:3002/send-reset-otp', { email })
      .then(response => {
        console.log(response.data); // Log the response data if needed
        setOtpSent(true);
        setMessage('OTP sent to your registered email address.');
        setActiveForm('otp');
        setContactNumber(response.data.contactNumber);
      })
      .catch(error => {
        setError('Failed to send OTP. Please try again.');
      })
      .finally(() => {
        setLoading(false); // Set loading to false after the request
      });
  };
  
  // Function to handle OTP verification
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true); // Set loading to true

    axios.post('http://localhost:3002/api/verify-otp', { code: otp, contactNumber })
      .then(response => {
        if (response.data.verified) {
          setOtpVerified(true);
          setMessage('OTP verified successfully.');
          setActiveForm('resetPassword');
        } else {
          setError('Invalid OTP. Please try again.');
        }
      })
      .catch(error => {
        setError('Failed to verify OTP. Please try again.');
      })
      .finally(() => {
        setLoading(false); // Set loading to false after the request
      });
  };
  
  // Function to handle resetting password
  const handleResetPassword = (e) => {
    e.preventDefault();

    if (!otpVerified) {
        alert('Please verify OTP before resetting your password');
        return;
    }

    if (!email) {
        alert('Please provide a valid email address.');
        return;
    }

    if (!newPassword || newPassword.length < 6) { // Basic validation for password length
        alert('Password must be at least 6 characters long.');
        return;
    }

    setError(''); // Reset any existing error message
    setMessage(''); // Reset success message
    setLoading(true); // Set loading to true

    // Send request to reset password using the email address
    axios.post('http://localhost:3002/reset-password', { email, newPassword })
        .then(response => {
            alert('Password reset successfully');
            setActiveForm('request'); // Reset to the initial form
            setOtpSent(false);
            setOtpVerified(false);
            setNewPassword('');
            setOtp('');
            setEmail('');
        })
        .catch(error => {
            console.error('Error resetting password:', error);
            alert('Failed to reset password. Please try again.');
        })
        .finally(() => {
          alert('Password reset successfully');
            setLoading(false); // Set loading to false after the request
        });
};

  
  
  return (
    <div className="forgot-password-container">
      <h1>Forgot Password</h1>

      {/* Email Input and Send OTP Button */}
      {activeForm === 'request' && (
        <form onSubmit={handleSendOtp} className="form-container">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* OTP Verification Input */}
      {activeForm === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="form-container">
          <input
            type="text"
            placeholder="Enter OTP sent to your email"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      {/* New Password Input */}
      {activeForm === 'resetPassword' && (
        <form onSubmit={handleResetPassword} className="form-container">
          <input
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      {/* Error and Message Display */}
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}
    </div>
  );
};

export default ForgotPassword;
