// src/index.js
import './styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot from 'react-dom/client'
import App from './App';
import { AuthProvider } from './AuthContext'; // Import the AuthProvider

const root = createRoot(document.getElementById('root')); // Create a root
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
