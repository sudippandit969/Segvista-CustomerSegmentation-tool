import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader } from 'lucide-react';
import axios from 'axios';
import { apiUrl } from '../api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(apiUrl('/api/register'), {
        name,
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="hero-bg-glow"></div>
      <div className="auth-card glass-panel">
        <UserPlus size={48} className="auth-icon" />
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join Segvista to unlock customer insights</p>
        
        {error && (
          <div style={{ 
            background: 'rgba(255, 75, 75, 0.1)', 
            border: '1px solid rgba(255, 75, 75, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#ff4b4b',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleRegister}>
          <input 
            type="text" 
            placeholder="Full Name" 
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={loading}
          >
            {loading ? <><Loader className="animate-spin" size={18} /> Creating account...</> : 'Get Started Free'}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
