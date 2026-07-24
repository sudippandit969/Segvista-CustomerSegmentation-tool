import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Loader } from 'lucide-react';
import axios from 'axios';
import { apiUrl } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(apiUrl('/api/login'), {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="hero-bg-glow"></div>
      <div className="auth-card glass-panel">
        <LogIn size={48} className="auth-icon" />
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to view your segmentation dashboard</p>
        
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

        <form className="auth-form" onSubmit={handleLogin}>
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
            {loading ? <><Loader className="animate-spin" size={18} /> Signing in...</> : 'Log In'}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
