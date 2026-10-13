import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Parties from './pages/Parties';
import Invoices from './pages/Invoices';
import Settlements from './pages/Settlements';
import Reports from './pages/Reports';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import AgentVouchers from './pages/AgentVouchers';
import Commissions from './pages/Commissions';
import { LayoutDashboard, Users, FileText, Activity, CreditCard, Edit3, PieChart, Wallet, Percent } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Parties', path: '/parties', icon: Users },
    { name: 'Trade Invoices', path: '/invoices', icon: FileText },
    { name: 'Sales Returns & Deductions', path: '/notes', icon: Edit3 },
    { name: 'Payments & Settlements', path: '/settlements', icon: CreditCard },
    { name: 'Agent Cashbook', path: '/vouchers', icon: Wallet },
    { name: 'Commissions', path: '/commissions', icon: Percent },
    { name: 'Reports & O/S Ledgers', path: '/reports', icon: Activity },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
  ];

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-main)' }}>AGENCY</h2>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACCOUNTING SYSTEM</p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.name} to={link.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--color-text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                }}
              >
                <Icon size={18} />
                {link.name}
              </motion.div>
            </Link>
          );
        })}
      </nav>
      
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/'; }} 
          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          Log Out
        </button>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  if (!token) {
    return <Login onLogin={(t) => setToken(t)} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/parties" element={<Parties />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/vouchers" element={<AgentVouchers />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
