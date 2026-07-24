import React from 'react';

const Logs = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '80px 5%', textAlign: 'center', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>System Logs</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        View the latest data processing and ML pipeline execution logs here.
      </p>
      <div className="glass-panel" style={{ marginTop: '40px', padding: '40px', maxWidth: '800px', margin: '40px auto', textAlign: 'left' }}>
        <p style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>[2026-07-22 10:15:22] Data ingested successfully.</p>
        <p style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>[2026-07-22 10:16:05] K-Means clustering complete (K=5).</p>
        <p style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>[2026-07-22 10:16:12] Dashboard data synchronized.</p>
      </div>
    </div>
  );
};

export default Logs;
