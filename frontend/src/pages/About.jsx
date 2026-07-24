import React from 'react';

const About = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '80px 5%', textAlign: 'center', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>About Us</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
        Segvista is a modern data analytics platform that uses machine learning to help you understand your customers better. We provide RFM analysis and K-Means clustering to uncover actionable insights.
      </p>
    </div>
  );
};

export default About;
