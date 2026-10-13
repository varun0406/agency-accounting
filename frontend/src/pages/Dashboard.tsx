import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp, Users, AlertCircle, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`);
      setStatsData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (!statsData) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

  const stats = [
    { title: 'Total Unsettled Trade', value: `₹${statsData.totalUnsettled.toLocaleString()}`, icon: IndianRupee, change: 'Live', isPositive: true },
    { title: 'Total Overdue Balance', value: `₹${statsData.totalOverdue.toLocaleString()}`, icon: AlertCircle, change: 'Live', isPositive: true },
    { title: 'Recent Payments & Settlements', value: `₹${statsData.recentSettlements.toLocaleString()}`, icon: TrendingUp, change: 'Live', isPositive: true },
    { title: 'Active Parties', value: statsData.activeParties.toString(), icon: Users, change: 'Live', isPositive: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Overview of trade balances, payments, returns and settlements.</p>
        </div>
        <Link to="/invoices">
          <button className="btn btn-primary">
            <ArrowUpRight size={16} /> New Trade Invoice
          </button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              className="premium-card"
              style={{ padding: '1.5rem' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                  <Icon size={20} color="var(--color-text-main)" />
                </div>
                <span className={`badge ${stat.isPositive ? 'badge-success' : 'badge-danger'}`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{stat.title}</p>
                <h3 style={{ fontSize: '1.5rem' }}>{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="premium-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Invoices</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inv No (Internal)</th>
                  <th>Supplier Bill No.</th>
                  <th>Bill Date</th>
                  <th>Supplier</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {statsData.recentInvoices.map((inv: any) => {
                  const total = inv.lines.reduce((sum: number, line: any) => sum + Number(line.lineTotal) + Number(line.taxAmount), 0);
                  return (
                    <tr key={inv.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)' }}>{inv.voucherNumber}</span></td>
                      <td><span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{inv.supplierBillNumber || '-'}</span></td>
                      <td>{new Date(inv.billDate).toLocaleDateString()}</td>
                      <td>{inv.supplier?.name}</td>
                      <td>{inv.buyer?.name}</td>
                      <td>₹{total.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${inv.status === 'SETTLED' ? 'badge-success' : inv.status === 'PARTIALLY_SETTLED' ? 'badge-warning' : 'badge-neutral'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {statsData.recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No recent invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
