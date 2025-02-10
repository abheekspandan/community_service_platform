import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav>
      <div className="navbar-container">

        {/* Hamburger menu */}
        <div className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>

        {/* Navigation links */}
        <ul className={`nav-links ${menuOpen ? 'show' : ''}`}>
          <li><Link to="/mainpage" onClick={toggleMenu}>Main Page</Link></li>
          <li><Link to="/raised-issues" onClick={toggleMenu}>Your Raised Issues</Link></li>
          <li><Link to="/your-raised-issues" onClick={toggleMenu}>Compose</Link></li>
          <li><Link to="/account-settings">Account Settings</Link></li> {/* New Link */}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
