import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('token'));
  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    closeMenu();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={closeMenu}>
        <Activity size={28} color="var(--accent-color)" />
        Seg<span>vista</span>
      </Link>

      <button
        className="nav-menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`nav-mobile-panel ${menuOpen ? 'is-open' : ''}`}>
        <div className="nav-center-links">
          <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
          <Link to="/feedbacks" className="nav-link" onClick={closeMenu}>Feedbacks</Link>
          <Link to="/contact" className="nav-link" onClick={closeMenu}>Contact</Link>
        </div>

        <div className="nav-auth-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn-primary" onClick={closeMenu}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <button type="button" className="btn-secondary" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" onClick={closeMenu}>Log In</Link>
              <Link to="/register" className="btn-primary" onClick={closeMenu}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
