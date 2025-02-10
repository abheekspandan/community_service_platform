import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Assuming you're using AuthContext for user info
import './AccountSettings.css';
import DeleteAccount from './deletebutton';

const AccountSettings = () => {
    const { user, logout } = useAuth(); // Get the logged-in user's details (like userId)

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '', // Contact number is included here
    });
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [currentPassword, setCurrentPassword] = useState(''); // State for current password

    const [activeForm, setActiveForm] = useState('reset'); // State to manage active form

    useEffect(() => {
        const userId = user.id;
        console.log("Fetching user data for user ID:", userId);
        axios.get(`http://localhost:3002/api/user/${userId}`)
            .then(response => {
                console.log("User data response:", response.data); // Log the entire response
                // Check if the data is nested
                if (response.data && response.data[0]) {
                    setFormData({
                        firstName: response.data[0].first_name || '',
                        lastName: response.data[0].last_name || '',
                        email: response.data[0].email || '',
                        contactNumber: response.data[0].contact_number || ''
                    });
                } else {
                    console.error('Unexpected response structure:', response.data);
                }
            })
            .catch(error => console.error('Error fetching user data:', error));
    }, [user.id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const userId = user.id;

        axios.put(`http://localhost:3002/api/user/${userId}`, formData)
            .then(response => {
                alert('Account updated successfully');
            })
            .catch(error => console.error('Error updating account:', error));
    };

    // Verify current password and then send OTP
    const handleSendOtp = () => {
        const userId = user.id;

        // Verify current password first
        axios.post(`http://localhost:3002/api/verify-password`, { userId, currentPassword })
            .then(response => {
                if (response.data.verified) {
                    console.log("Verified password:", response.data);
                    if (formData.contactNumber) {  // Ensure contact number is not empty
                        axios.post('http://localhost:3002/api/send-otp', { contactNumber: formData.contactNumber })
                            .then(response => {
                                setOtpSent(true);
                                alert('OTP sent to your registered mobile number');
                                setActiveForm('otp'); // Show OTP form
                            })
                            .catch(error => console.error('Error sending OTP:', error));
                    } else {
                        alert('Contact number is missing. Please update your contact number.');
                    }
                } else {
                    alert('Current password is incorrect');
                }
            })
            .catch(error => console.error('Error verifying password:', error));
    };

    // Verify OTP
    const handleVerifyOtp = () => {
        // Clean the contact number and ensure it's in the correct format
        let cleanedContactNumber = formData.contactNumber.replace(/\s+/g, '');  // Remove spaces
        if (!cleanedContactNumber.startsWith('+')) {
            cleanedContactNumber = `+91${cleanedContactNumber}`;  // Add country code (for India, +91)
        }
    
        axios.post('http://localhost:3002/api/verify-otp', {
            code: otp,
            contactNumber: cleanedContactNumber
        })
        .then(response => {
            console.log('Verify OTP Response:', response.data);
            if (response.data.verified) {
                setOtpVerified(true);
                alert('OTP verified successfully');
                setActiveForm('resetPassword'); // Show reset password form
            } else {
                alert('Incorrect OTP, please try again');
            }
        })
        .catch(error => {
            console.error('Error verifying OTP:', error.response || error.message);
            alert('An error occurred while verifying the OTP. Please try again later.');
        });
    };
    

    // Reset Password
    const handleResetPassword = (e) => {
        e.preventDefault();
        if (!otpVerified) {
            alert('Please verify OTP before resetting your password');
            return;
        }
    
        axios.post('http://localhost:3002/api/reset-password', { userId: user.id, newPassword })
            .then(response => {
                alert('Password reset successfully');
                setActiveForm('reset'); // Reset to the initial form
                setOtpSent(false);
                setOtpVerified(false);
                setNewPassword('');
                setOtp('');
                setCurrentPassword('');
            })
            .catch(error => console.error('Error resetting password:', error));

            alert('Your password has been updated successfully!');  // Additional alert for password update
    
    };
    
    
    return (
        <div className="account-settings">
            <button
        className="logout-button"
        onClick={logout}
        style={{ position: 'absolute', top: '-12px', right: '10px' }}
      >
        Logout
      </button>
            <h2>Account Settings</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>First Name:</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Last Name:</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Contact Number:</label>
                    <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Update Account</button>
            </form>

            {/* Reset Password Section */}
            {activeForm === 'reset' && (
                <form>
                    <h3>Reset Password</h3>
                    <div>
                        <label>Current Password:</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                        <button type="button" onClick={handleSendOtp}>Send OTP</button>
                    </div>
                </form>
            )}

            {/* OTP Verification Form */}
            {activeForm === 'otp' && (
                <form>
                    <div>
                        <label>Enter OTP:</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                        <button type="button" onClick={handleVerifyOtp}>Verify OTP</button>
                    </div>
                </form>
            )}

            {/* New Password Form */}
            {activeForm === 'resetPassword' && (
                <form onSubmit={handleResetPassword}>
                    <div>
                        <label>New Password:</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Reset Password</button>
                </form>
            )}
           <div className="delete-button-container">
                <DeleteAccount />
            </div>
        </div>
    );
};

export default AccountSettings;
