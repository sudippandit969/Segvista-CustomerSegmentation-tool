import React from 'react';

const Contact = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '80px 5%', textAlign: 'center', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Contact Us</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Have questions? We'd love to hear from you.
      </p>
      
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '40px auto', padding: '40px' }}>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Your Name" className="input-field" required />
          <input type="email" placeholder="Your Email" className="input-field" required />
          <textarea placeholder="Your Message" className="input-field" rows="5" required style={{ resize: 'vertical' }}></textarea>
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
