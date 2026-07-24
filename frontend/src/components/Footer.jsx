import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Segvista</h3>
          <p>Advanced Customer Segmentation & Retention Analysis Platform.</p>
          <p>Unlocking insights from your data.</p>
        </div>
        <div className="footer-section">
          <h3>Product</h3>
          <ul>
            <li><Link to="/">Features</Link></li>
            <li><Link to="/">Pricing</Link></li>
            <li><Link to="/">Integrations</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><Link to="/">Documentation</Link></li>
            <li><Link to="/">Blog</Link></li>
            <li><Link to="/">Support</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><Link to="/">Privacy Policy</Link></li>
            <li><Link to="/">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Segvista Analytics. Developed by <a href="https://github.com/sudip" target="_blank" rel="noopener noreferrer">Sudip</a>.</p>
      </div>
    </footer>
  );
};

export default Footer;
