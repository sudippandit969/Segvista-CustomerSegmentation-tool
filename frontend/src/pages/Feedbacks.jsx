import React from 'react';

const Feedbacks = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '80px 5%', textAlign: 'center', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>User Feedbacks</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        See what our users are saying about Segvista.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '40px', maxWidth: '1000px', margin: '40px auto' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p>"Segvista helped us increase our retention by 25%!"</p>
          <span style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>- Marketing Director, RetailCo</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p>"The RFM analysis dashboards are incredibly intuitive."</p>
          <span style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>- Data Analyst, TechStart</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p>"A must-have tool for any serious e-commerce business."</p>
          <span style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>- CEO, CommerceLens</span>
        </div>
      </div>
    </div>
  );
};

export default Feedbacks;
