import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    noteType: 'SALES_RETURN',
    noteDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    buyerId: '',
    tradeInvoiceId: '',
    itemDescription: '',
    adjustedMeters: '',
    rate: '',
    taxableValue: '',
    gstDetails: '',
    totalAdjustmentAmount: '',
    adjustmentDirection: 'DECREASE',
    reason: '',
    remarks: ''
  });

  useEffect(() => {
    fetchNotes();
    fetchParties();
    fetchInvoices();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/notes`);
      setNotes(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchParties = async () => {
    try {
      const response = await axios.get(`${API_URL}/parties`);
      setParties(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/invoices`);
      setInvoices(response.data);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/notes`, formData);
      setIsModalOpen(false);
      setFormData({
        noteType: 'SALES_RETURN', noteDate: new Date().toISOString().split('T')[0], supplierId: '', buyerId: '',
        tradeInvoiceId: '', itemDescription: '', adjustedMeters: '', rate: '', taxableValue: '', gstDetails: '',
        totalAdjustmentAmount: '', adjustmentDirection: 'DECREASE', reason: '', remarks: ''
      });
      fetchNotes();
    } catch (error) {
      console.error(error);
      alert('Failed to save adjustment note.');
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Note?')) return;
    try {
      await axios.delete(`${API_URL}/notes/${id}`);
      if (typeof fetchInvoices === 'function' && typeof fetchInvoices !== 'undefined') fetchInvoices();
      if (typeof fetchNotes === 'function' && typeof fetchNotes !== 'undefined') fetchNotes();
      if (typeof fetchSettlements === 'function' && typeof fetchSettlements !== 'undefined') fetchSettlements();
      if (typeof fetchVouchers === 'function' && typeof fetchVouchers !== 'undefined') fetchVouchers();
      if (typeof fetchCommissions === 'function' && typeof fetchCommissions !== 'undefined') fetchCommissions();
      if (typeof fetchParties === 'function' && typeof fetchParties !== 'undefined') fetchParties();
    } catch (error) {
      console.error(error);
      alert('Failed to delete Note');
    }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Adjustments & Notes</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Returns, Debit Notes, and Credit Notes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Record Note
        </button>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Note No</th>
                <th>Type</th>
                <th>Date</th>
                <th>Parties</th>
                <th>Linked Invoice</th>
                <th>Amount</th>
                <th>Direction</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note: any) => (
                <tr key={note.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{note.noteNumber}</span></td>
                  <td>
                    <span className="badge badge-neutral">{note.noteType.replace('_', ' ')}</span>
                  </td>
                  <td>{new Date(note.noteDate).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.75rem' }}>
                    S: {note.supplier?.name}<br/>
                    B: {note.buyer?.name}
                  </td>
                  <td>{note.tradeInvoice ? 
                    <span>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Bill: {note.tradeInvoice.supplierBillNumber || '-'}</span>
                      <br/><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Inv: {note.tradeInvoice.voucherNumber}</span>
                    </span> 
                    : '-'}</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(note.totalAdjustmentAmount).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${note.adjustmentDirection === 'INCREASE' ? 'badge-success' : 'badge-danger'}`}>
                      {note.adjustmentDirection}
                    </span>
                  </td>
                  <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(note.id)}>Delete</button></td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No adjustment notes recorded yet.
                  </td>
                  <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(note.id)}>Delete</button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ padding: '2rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit3 size={24} /> Record Adjustment Note
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Note Type</label>
                  <select required className="input-field" value={formData.noteType} onChange={e => setFormData({...formData, noteType: e.target.value})}>
                    <option value="SALES_RETURN">Sales Return</option>
                    <option value="PURCHASE_RETURN">Purchase Return</option>
                    <option value="DEBIT_NOTE">Debit Note</option>
                    <option value="CREDIT_NOTE">Credit Note</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Date</label>
                  <input required type="date" className="input-field" value={formData.noteDate} onChange={e => setFormData({...formData, noteDate: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Supplier</label>
                  <select required className="input-field" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Select Supplier...</option>
                    {parties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Buyer</label>
                  <select required className="input-field" value={formData.buyerId} onChange={e => setFormData({...formData, buyerId: e.target.value})}>
                    <option value="">Select Buyer...</option>
                    {parties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Linked Invoice (Optional)</label>
                  <select className="input-field" value={formData.tradeInvoiceId} onChange={e => setFormData({...formData, tradeInvoiceId: e.target.value})}>
                    <option value="">None / Standalone Note</option>
                    {invoices.filter((inv: any) => (!formData.supplierId || inv.supplierId === formData.supplierId) && (!formData.buyerId || inv.buyerId === formData.buyerId)).map((inv: any) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.supplierBillNumber ? `Bill: ${inv.supplierBillNumber} (Inv: ${inv.voucherNumber}) - ₹${inv.lines.reduce((s:number, l:any) => s+Number(l.lineTotal)+Number(l.taxAmount),0).toLocaleString()}` : `${inv.voucherNumber}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Effect on Invoice Balance</label>
                  <select required className="input-field" value={formData.adjustmentDirection} onChange={e => setFormData({...formData, adjustmentDirection: e.target.value})}>
                    <option value="DECREASE">Decrease Balance (e.g. Return, Discount)</option>
                    <option value="INCREASE">Increase Balance (e.g. Additional Charge)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Item Description</label>
                  <input type="text" className="input-field" value={formData.itemDescription} onChange={e => setFormData({...formData, itemDescription: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Total Adjustment Amount (₹)</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.totalAdjustmentAmount} onChange={e => setFormData({...formData, totalAdjustmentAmount: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Reason / Remarks</label>
                <input type="text" className="input-field" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Note</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
