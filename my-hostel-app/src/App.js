// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import MainPage from './MainPage';
import Register from './Register';
import RaisedIssues from './RaisedIssues';
import Navbar from './Navbar'; 
import YourRaisedIssues from './YourRaisedIssue'; // Adjust the path as needed
import AccountSettings from './AccountSettings'; // Import the new component
import VerifyOTP from './Intro/VerifyOtp';
import ResetPassword from './Intro/ResetPassword';
import '@fortawesome/fontawesome-free/css/all.min.css';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Routes Component
const AppRoutes = () => (
  <Routes>
    {/* Redirect root to login */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Public Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Protected Routes (require user to be logged in) */}
    <Route 
      path="/mainpage" 
      element={
        <ProtectedRoute>
          <MainPage />
        </ProtectedRoute>
      }
    />
    <Route 
      path="/raised-issues" 
      element={
        <ProtectedRoute>
          <RaisedIssues />
        </ProtectedRoute>
      }
    />

    <Route path="/your-raised-issues" element={<YourRaisedIssues />} />
    
    {/* Fallback Route */}
    <Route path="*" element={<Navigate to="/login" replace />} />
    <Route path="/forgot-password" element={<VerifyOTP />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route 
      path="/account-settings" 
      element={
        <ProtectedRoute>
          <AccountSettings />
          </ProtectedRoute>
      }
    />
    
  </Routes>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar /> {/* Show Navbar on all pages */}
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
