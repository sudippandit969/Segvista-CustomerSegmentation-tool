import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, Users, PieChart, Sparkles } from 'lucide-react';

const Home = () => {
  return (
    <div className="animate-fade-in">
      <section className="hero">
        <div className="hero-bg-glow"></div>
        <div className="hero-content" style={{ maxWidth: '850px', textAlign: 'center', margin: '0 auto' }}>
          <div className="hero-badge" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '30px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: 'var(--accent-color)',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '24px',
          }}>
            <Sparkles size={15} /> AI-Powered Customer Intelligence Platform
          </div>

          <h1 className="hero-title">Unlock Deep Insights from Your Customer Data</h1>
          <p className="hero-subtitle">
            Segvista empowers your business with K-Means machine learning clustering and advanced RFM analytics to pinpoint your VIPs, re-engage churn risks, and maximize lifetime customer value.
          </p>

          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/register" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '1.05rem' }}>
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Explore Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section" style={{ padding: '90px 5%', background: 'rgba(255, 255, 255, 0.35)' }}>
        <div className="features-heading" style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 60px auto' }}>
          <h2 style={{ fontSize: '2.4rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Why Industry Leaders Choose Segvista</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Transform raw transaction rows into actionable retention strategies in seconds.
          </p>
        </div>

        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="glass-panel feature-card" style={{ padding: '40px', textAlign: 'left', transition: 'transform 0.3s ease' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <Users size={30} color="var(--accent-color)" />
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>AI Customer Segmentation</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Automatically group customers into 5 distinct behavioral segments using scikit-learn K-Means algorithms.
            </p>
          </div>

          <div className="glass-panel feature-card" style={{ padding: '40px', textAlign: 'left', transition: 'transform 0.3s ease' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <BarChart2 size={30} color="#a855f7" />
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>RFM & Churn Predictive Engine</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Analyze Recency, Frequency, and Monetary scores to calculate exact Churn Risk and Customer Lifetime Value (LTV).
            </p>
          </div>

          <div className="glass-panel feature-card" style={{ padding: '40px', textAlign: 'left', transition: 'transform 0.3s ease' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <PieChart size={30} color="#34d399" />
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Interactive Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Real-time charts, customer directory filtering, CSV exports, and executive retention KPIs out of the box.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
