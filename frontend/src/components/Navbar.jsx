import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Activity size={28} color="var(--accent-color)" />
        Seg<span>vista</span>
      </Link>
      
      <div className="nav-center-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About</Link>
        <Link to="/logs" className="nav-link">Logs</Link>
        <Link to="/feedbacks" className="nav-link">Feedbacks</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
      </div>

      <div className="nav-auth-buttons">
        <Link to="/login" className="btn-secondary">Log In</Link>
        <Link to="/register" className="btn-primary">Get Started</Link>
      </div>
    </nav>
  );
};

export default Navbar;
