import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader, ArrowRight, Upload, CloudUpload, CheckCircle, AlertTriangle, X, Info } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#ff4b4b'];

// Toast notification component
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  const isError = toast.type === 'error';

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '480px',
      width: '100%',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div style={{
        background: isError ? '#1a0505' : isWarning ? '#1a1205' : '#051a0f',
        border: `1px solid ${isError ? 'rgba(255,75,75,0.3)' : isWarning ? 'rgba(255,187,40,0.3)' : 'rgba(0,196,159,0.3)'}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {isSuccess && <CheckCircle size={22} color="#00C49F" style={{ marginTop: '2px', flexShrink: 0 }} />}
          {isWarning && <AlertTriangle size={22} color="#FFBB28" style={{ marginTop: '2px', flexShrink: 0 }} />}
          {isError && <AlertTriangle size={22} color="#ff4b4b" style={{ marginTop: '2px', flexShrink: 0 }} />}
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>
              {toast.title}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {toast.message}
            </div>
            
            {toast.warnings && toast.warnings.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#FFBB28', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={14} /> Some analyses were limited:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7' }}>
                  {toast.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <button onClick={onClose} style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            color: 'rgba(255,255,255,0.5)', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            padding: '4px',
            flexShrink: 0,
          }}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [topCustomers, setTopCustomers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = React.useRef(null);

  const showToast = (type, title, message, warnings = []) => {
    setToast({ type, title, message, warnings });
    // Auto-dismiss after 8 seconds (longer if warnings)
    setTimeout(() => setToast(null), warnings.length > 0 ? 15000 : 6000);
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    setLoading(true);
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const [dashRes, topRes] = await Promise.all([
        axios.get('http://localhost:8000/api/dashboard', { headers }),
        axios.get('http://localhost:8000/api/customers/top', { headers })
      ]);

      if (dashRes.data && Object.keys(dashRes.data).length > 0) {
        setData(dashRes.data);
        setTopCustomers(topRes.data);
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch (error) {
      // 401 or CORS/network error (blocked 401 appears as network error)
      if (error.response?.status === 401 || error.message === 'Network Error') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      console.error('Error fetching dashboard data:', error);
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
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const headers = getAuthHeader();
    if (!headers) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/upload', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      const { message, warnings } = response.data;

      // Refresh data
      await fetchData();

      // Show success toast with any warnings
      if (warnings && warnings.length > 0) {
        showToast('warning', 'Data Uploaded with Limitations', message, warnings);
      } else {
        showToast('success', 'Upload Successful!', message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      showToast('error', 'Upload Failed', errorMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return (
      <div className="dashboard-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Loader className="animate-spin" size={48} style={{ color: 'var(--accent-color)' }} />
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className="dashboard-container animate-fade-in" style={{ minHeight: '100vh' }}>
        <Toast toast={toast} onClose={() => setToast(null)} />
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Welcome, {user.name || 'there'}!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Get started by uploading your customer transaction data.</p>
          </div>
          <button className="btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="glass-panel" style={{ 
          padding: '80px 40px', 
          textAlign: 'center', 
          marginTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <CloudUpload size={56} style={{ color: 'var(--accent-color)' }} />
          </div>
          <h2 style={{ fontSize: '1.8rem' }}>No Data Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.7' }}>
            Upload a CSV file with your customer data. We'll automatically detect your columns and run every analysis we can.
          </p>
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current.click()}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '16px 32px', 
              fontSize: '1.1rem',
              opacity: uploading ? 0.7 : 1 
            }}
            disabled={uploading}
          >
            {uploading ? <><Loader className="animate-spin" size={20} /> Processing...</> : <><Upload size={20} /> Upload CSV File</>}
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px' }}>
            Only <strong>CustomerID</strong> is required. The more fields you provide, the richer your analysis will be.
          </p>
        </div>
      </div>
    );
  }

  // Helper for KPI rendering
  const renderKPI = (title, value, formatter, delta, deltaColor = '#66fcf1') => (
    <div className="stat-card glass-panel">
      <span className="stat-title">{title}</span>
      {value !== null && value !== undefined ? (
        <>
          <span className="stat-value">{formatter(value)}</span>
          <span style={{ color: deltaColor, fontSize: '0.9rem' }}>+{delta}% from last month</span>
        </>
      ) : (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontStyle: 'italic' }}>Not available</span>
      )}
    </div>
  );

  // Helper for unavailable chart sections
  const UnavailableChart = ({ title }) => (
    <div className="glass-panel" style={{ padding: '20px', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{title}</h3>
      <AlertTriangle size={40} style={{ color: 'var(--text-secondary)', opacity: 0.4, marginBottom: '12px' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '250px' }}>
        Not enough data for this chart. Upload a CSV with more fields to unlock.
      </p>
    </div>
  );

  return (
    <div className="dashboard-container animate-fade-in" style={{ paddingBottom: '40px' }}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Executive Overview</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name || 'there'}. Here's what's happening with your customers today.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            className="btn-primary" 
            onClick={() => fileInputRef.current.click()} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: uploading ? 0.7 : 1 }}
            disabled={uploading}
          >
            {uploading ? <Loader className="animate-spin" size={18} /> : 'Upload Data (CSV)'}
          </button>
          
          <button className="btn-secondary" onClick={() => navigate('/customers')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            View Directory <ArrowRight size={18} />
          </button>
          <button className="btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="stats-grid">
        {renderKPI('Total Revenue', data.kpis.totalRevenue, (v) => `$${(v / 1000000).toFixed(2)}M`, data.deltas.totalRevenue)}
        {renderKPI('Active Customers', data.kpis.activeCustomers, (v) => v.toLocaleString(), data.deltas.activeCustomers)}
        {renderKPI('Average LTV', data.kpis.averageLtv, (v) => `$${v.toFixed(0)}`, data.deltas.averageLtv)}
        {renderKPI('Churn Rate', data.kpis.churnRate, (v) => `${v.toFixed(1)}%`, data.deltas.churnRate, '#ff4b4b')}
      </div>
      
      {/* Charts Row 1 */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        {data.charts.salesTrend && data.charts.salesTrend.length > 0 ? (
          <div className="glass-panel" style={{ padding: '20px', minHeight: '350px' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Monthly Sales Trend (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={data.charts.salesTrend} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <UnavailableChart title="Monthly Sales Trend" />
        )}

        {data.charts.segmentDistribution && data.charts.segmentDistribution.length > 0 ? (
          <div className="glass-panel" style={{ padding: '20px', minHeight: '350px' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Customer Segments</h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={data.charts.segmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.charts.segmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <UnavailableChart title="Customer Segments" />
        )}
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {data.charts.paymentModes && data.charts.paymentModes.length > 0 ? (
          <div className="glass-panel" style={{ padding: '20px', minHeight: '350px' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Payment Mode Preferences by Segment</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={data.charts.paymentModes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="Segment" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} />
                <Legend />
                <Bar dataKey="Bank Transfer" stackId="a" fill="#0088FE" />
                <Bar dataKey="Credit Card" stackId="a" fill="#00C49F" />
                <Bar dataKey="Debit Card" stackId="a" fill="#FFBB28" />
                <Bar dataKey="PayPal" stackId="a" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <UnavailableChart title="Payment Mode Preferences" />
        )}

        <div className="glass-panel" style={{ padding: '20px', minHeight: '350px', overflowY: 'auto' }}>
          {topCustomers && topCustomers.atRisk && topCustomers.atRisk.length > 0 ? (
            <>
              <h3 style={{ color: '#ff4b4b', marginBottom: '20px' }}>Top 5 Customers to Re-engage (At Risk)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>ID</th>
                    <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>Recency</th>
                    <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>Past Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.atRisk.map((customer) => (
                    <tr key={customer.CustomerID} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{customer.CustomerID}</td>
                      <td style={{ padding: '10px', color: '#ff4b4b' }}>{customer.Recency} days</td>
                      <td style={{ padding: '10px' }}>${customer.Monetary?.toFixed(0) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              <AlertTriangle size={32} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.9rem' }}>At-Risk customer data unavailable</p>
            </div>
          )}
          
          {topCustomers && topCustomers.vips && topCustomers.vips.length > 0 ? (
            <>
              <h3 style={{ color: '#0088FE', marginTop: '30px', marginBottom: '20px' }}>Top 5 VIPs</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>ID</th>
                    <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>Freq</th>
                    <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.vips.map((customer) => (
                    <tr key={customer.CustomerID} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{customer.CustomerID}</td>
                      <td style={{ padding: '10px' }}>{customer.Frequency || '—'}</td>
                      <td style={{ padding: '10px', color: '#0088FE' }}>${customer['Customer Lifetime Value']?.toFixed(0) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', marginTop: topCustomers?.atRisk?.length ? '20px' : '0' }}>
              <AlertTriangle size={32} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.9rem' }}>VIP customer data unavailable</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
