  import React, { createContext, useState, useContext } from 'react';

  // Create the context
  const AuthContext = createContext();

  // Provide AuthContext to children
  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Function to log in and store token and user
    // const login = (token, userData) => {
    //   setToken(token);
    //   setUser(userData); // Store user data
    //   // Optionally store token and user in localStorage for persistence
    //   localStorage.setItem('token', token);
    //   localStorage.setItem('user', JSON.stringify(userData));
    // };

    const login = (token, userData) => {
      setToken(token);
      setUser({ ...userData, role: userData.role || 'user' });  // Ensure role is set
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...userData, role: userData.role || 'user' }));  // Store role in local storage
    };
    
    

    // Function to log out and clear token and user
    const logout = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };

    return (
      <AuthContext.Provider value={{ user, token, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
  };

  // Custom hook to use AuthContext
  export const useAuth = () => useContext(AuthContext);
