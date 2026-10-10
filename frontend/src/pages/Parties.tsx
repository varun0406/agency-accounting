import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, User, Building } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Parties() {
  const [parties, setParties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    role: 'SUPPLIER',
    contactPerson: '',
    mobile: '',
    email: '',
    billingAddress: '',
    state: '',
    stateCode: '',
    gstin: '',
    pan: '',
    creditPeriodDays: 0,
    openingBalanceAmount: 0,
    openingBalanceType: 'RECEIVABLE',
    commissionRate: 0,
    notes: ''
  });

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await axios.get(`${API_URL}/parties`);
      setParties(response.data);
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/parties/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/parties`, formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        code: '', name: '', role: 'SUPPLIER', contactPerson: '', mobile: '', email: '', billingAddress: '', state: '', stateCode: '', gstin: '', pan: '', creditPeriodDays: 0, openingBalanceAmount: 0, openingBalanceType: 'RECEIVABLE', commissionRate: 0, notes: ''
      });
      fetchParties();
    } catch (error) {
      console.error('Error saving party:', error);
      alert('Failed to save party. Check console for details.');
    }
  };

  const handleEdit = (party: any) => {
    setFormData({
      code: party.code || '',
      name: party.name || '',
      role: party.role || 'SUPPLIER',
      contactPerson: party.contactPerson || '',
      mobile: party.mobile || '',
      email: party.email || '',
      billingAddress: party.billingAddress || '',
      state: party.state || '',
      stateCode: party.stateCode || '',
      gstin: party.gstin || '',
      pan: party.pan || '',
      creditPeriodDays: party.creditPeriodDays || 0,
      openingBalanceAmount: Number(party.openingBalanceAmount) || 0,
      openingBalanceType: party.openingBalanceType || 'RECEIVABLE',
      commissionRate: Number(party.commissionRate) || 0,
      notes: party.notes || ''
    });
    setEditingId(party.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Party?')) return;
    try {
      await axios.delete(`${API_URL}/parties/${id}`);
      fetchParties();
    } catch (error) {
      console.error(error);
      alert('Failed to delete Party');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Parties</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage suppliers and buyers in the system.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { 
          setEditingId(null);
          setFormData({
            code: '', name: '', role: 'SUPPLIER', contactPerson: '', mobile: '', email: '', billingAddress: '', state: '', stateCode: '', gstin: '', pan: '', creditPeriodDays: 0, openingBalanceAmount: 0, openingBalanceType: 'RECEIVABLE', commissionRate: 0, notes: ''
          });
          setIsModalOpen(true); 
        }}>
          <Plus size={16} /> Add Party
        </button>
      </div>

      <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Role</th>
                <th>Contact Person</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((party: any) => (
                <tr key={party.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{party.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{party.name}</td>
                  <td>
                    <span className={`badge ${party.role === 'SUPPLIER' ? 'badge-warning' : party.role === 'BUYER' ? 'badge-success' : 'badge-neutral'}`}>
                      {party.role === 'SUPPLIER' ? <Building2 size={12} style={{ marginRight: '4px' }}/> : party.role === 'BUYER' ? <User size={12} style={{ marginRight: '4px' }}/> : <Building size={12} style={{ marginRight: '4px' }}/>}
                      {party.role}
                    </span>
                  </td>
                  <td>{party.contactPerson || '-'}</td>
                  <td>{party.mobile || '-'}</td>
                  <td>
                    <span className={`badge ${party.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {party.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-primary)'}} onClick={() => handleEdit(party)}>Edit</button>
                      <button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(party.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {parties.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No parties found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="premium-card" 
            style={{ padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Party' : 'Add New Party'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Party Code (Unique)</label>
                <input required type="text" className="input-field" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. SUP-001" disabled={!!editingId} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Business Name</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Legal Name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={!!editingId}>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="BUYER">Buyer</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Contact Person</label>
                  <input type="text" className="input-field" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mobile</label>
                  <input type="text" className="input-field" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>
              
              {formData.role === 'SUPPLIER' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Default Commission Rate (%)</label>
                  <input type="number" step="0.01" className="input-field" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: parseFloat(e.target.value) || 0})} placeholder="e.g. 2.5" />
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update Party' : 'Save Party'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
