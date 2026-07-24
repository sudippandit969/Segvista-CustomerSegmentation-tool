import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, Loader, ArrowLeft } from 'lucide-react';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState('All');

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCustomers = async (segment) => {
    setLoading(true);
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const url = segment === 'All' 
        ? 'http://localhost:8000/api/customers' 
        : `http://localhost:8000/api/customers?segment=${segment}`;
      const response = await axios.get(url, { headers });
      setCustomers(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCustomers(segmentFilter);
  }, [segmentFilter]);

  const handleExport = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // For export, we need to pass the token as a query param since window.open can't set headers
    const url = segmentFilter === 'All' 
      ? `http://localhost:8000/api/export?token=${token}` 
      : `http://localhost:8000/api/export?segment=${segmentFilter}&token=${token}`;
    window.open(url, '_blank');
  };

  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'VIP': return '#0088FE';
      case 'Loyal': return '#FF8042';
      case 'Regular': return '#00C49F';
      case 'At Risk': return '#ff4b4b';
      case 'Lost': return '#FFBB28';
      default: return '#64748b';
    }
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/dashboard')} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '8px 16px',
                fontSize: '0.9rem'
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
          <h2>Customer Directory</h2>
          <p style={{ color: 'var(--text-secondary)' }}>View, filter, and export your segmented customer list.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <select 
            className="input-field" 
            style={{ width: '200px', marginBottom: 0 }}
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
          >
            <option value="All">All Segments</option>
            <option value="VIP">VIP</option>
            <option value="Loyal">Loyal</option>
            <option value="Regular">Regular</option>
            <option value="At Risk">At Risk</option>
            <option value="Lost">Lost</option>
          </select>
          
          <button className="btn-primary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export to CSV
          </button>
        </div>
      </div>
      
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Loader className="animate-spin" size={32} style={{ color: 'var(--accent-color)' }} />
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No customer data found. Upload a CSV file from the Dashboard first.</p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/dashboard')}
              style={{ marginTop: '20px' }}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Customer ID</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Segment</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Recency (Days)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Frequency</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Monetary ($)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>LTV ($)</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 100).map((customer) => (
                  <tr key={customer.CustomerID} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '500' }}>{customer.CustomerID}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        backgroundColor: `${getSegmentColor(customer.Segment)}20`,
                        color: getSegmentColor(customer.Segment)
                      }}>
                        {customer.Segment}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>{customer.Recency}</td>
                    <td style={{ padding: '16px 20px' }}>{customer.Frequency}</td>
                    <td style={{ padding: '16px 20px' }}>${customer.Monetary.toFixed(2)}</td>
                    <td style={{ padding: '16px 20px' }}>${customer['Customer Lifetime Value'].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length > 100 && (
              <div style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Showing top 100 results. Please export to view all {customers.length} customers.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
