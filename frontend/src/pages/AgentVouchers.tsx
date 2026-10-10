import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AgentVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [parties, setParties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    voucherType: 'RECEIPT',
    voucherDate: new Date().toISOString().split('T')[0],
    partyId: '',
    amount: '',
    accountName: 'Main Bank Account',
    paymentMode: 'Bank Transfer',
    referenceNumber: '',
    purpose: '',
    remarks: ''
  });

  useEffect(() => {
    fetchVouchers();
    fetchParties();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await axios.get(`${API_URL}/vouchers`);
      setVouchers(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchParties = async () => {
    try {
      const response = await axios.get(`${API_URL}/parties`);
      setParties(response.data);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/vouchers`, formData);
      setIsModalOpen(false);
      setFormData({
        voucherType: 'RECEIPT', voucherDate: new Date().toISOString().split('T')[0], partyId: '', amount: '',
        accountName: 'Main Bank Account', paymentMode: 'Bank Transfer', referenceNumber: '', purpose: '', remarks: ''
      });
      fetchVouchers();
    } catch (error) {
      console.error(error);
      alert('Failed to save voucher.');
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Voucher?')) return;
    try {
      await axios.delete(`${API_URL}/vouchers/${id}`);
      if (typeof fetchInvoices === 'function' && typeof fetchInvoices !== 'undefined') fetchInvoices();
      if (typeof fetchNotes === 'function' && typeof fetchNotes !== 'undefined') fetchNotes();
      if (typeof fetchSettlements === 'function' && typeof fetchSettlements !== 'undefined') fetchSettlements();
      if (typeof fetchVouchers === 'function' && typeof fetchVouchers !== 'undefined') fetchVouchers();
      if (typeof fetchCommissions === 'function' && typeof fetchCommissions !== 'undefined') fetchCommissions();
      if (typeof fetchParties === 'function' && typeof fetchParties !== 'undefined') fetchParties();
    } catch (error) {
      console.error(error);
      alert('Failed to delete Voucher');
    }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Agent Cashbook</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your agency's actual receipts, payments, and bank transactions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Record Voucher
        </button>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Type</th>
                <th>Party</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher: any) => (
                <tr key={voucher.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{voucher.voucherNumber}</span></td>
                  <td>{new Date(voucher.voucherDate).toLocaleDateString()}</td>
                  <td>
                    {voucher.voucherType === 'RECEIPT' ? (
                      <span className="badge badge-success"><ArrowDownLeft size={12} style={{ marginRight: '4px' }}/> RECEIPT</span>
                    ) : voucher.voucherType === 'PAYMENT' ? (
                      <span className="badge badge-danger"><ArrowUpRight size={12} style={{ marginRight: '4px' }}/> PAYMENT</span>
                    ) : (
                      <span className="badge badge-neutral">JOURNAL</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{voucher.party?.name}</td>
                  <td>{voucher.accountName}</td>
                  <td style={{ fontWeight: 600, color: voucher.voucherType === 'RECEIPT' ? 'var(--color-success)' : voucher.voucherType === 'PAYMENT' ? 'var(--color-danger)' : 'inherit' }}>
                    {voucher.voucherType === 'PAYMENT' ? '-' : ''}₹{Number(voucher.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>{voucher.purpose || '-'}</td>
                  <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(voucher.id)}>Delete</button></td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No agency cash/bank vouchers recorded yet.
                  </td>
                  <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(voucher.id)}>Delete</button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ padding: '2rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={24} /> Record Agent Cash/Bank Voucher
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Voucher Type</label>
                  <select required className="input-field" value={formData.voucherType} onChange={e => setFormData({...formData, voucherType: e.target.value})}>
                    <option value="RECEIPT">Money Received In (Receipt)</option>
                    <option value="PAYMENT">Money Paid Out (Payment)</option>
                    <option value="JOURNAL">Adjustment (Journal)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Date</label>
                  <input required type="date" className="input-field" value={formData.voucherDate} onChange={e => setFormData({...formData, voucherDate: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Related Party</label>
                  <select required className="input-field" value={formData.partyId} onChange={e => setFormData({...formData, partyId: e.target.value})}>
                    <option value="">Select Party...</option>
                    {parties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Amount (₹)</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Account</label>
                  <select className="input-field" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})}>
                    <option value="Main Bank Account">Main Bank Account</option>
                    <option value="Cash in Hand">Cash in Hand</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Payment Mode</label>
                  <input required type="text" className="input-field" value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Reference (UTR)</label>
                  <input type="text" className="input-field" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Purpose (e.g. Commission Received)</label>
                <input required type="text" className="input-field" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Voucher</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
