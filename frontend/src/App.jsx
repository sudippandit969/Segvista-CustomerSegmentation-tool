import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Logs from './pages/Logs';
import Feedbacks from './pages/Feedbacks';
import Contact from './pages/Contact';
import Customers from './pages/Customers';
import './index.css';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  // Only hide navbar/footer on the dashboard page itself
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="app-container">
      {!isDashboard && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/about" element={<About />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/feedbacks" element={<Feedbacks />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
