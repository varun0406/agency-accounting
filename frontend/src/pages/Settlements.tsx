import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    payerId: '',
    payeeId: '',
    amount: '',
    paymentMode: 'Bank Transfer',
    bankReference: '',
    agentHandledMoney: false,
    remarks: '',
    allocations: [] as { tradeInvoiceId: string, allocatedAmount: string }[]
  });

  useEffect(() => {
    fetchSettlements();
    fetchParties();
    fetchInvoices();
  }, []);

  const fetchSettlements = async () => {
    try {
      const response = await axios.get(`${API_URL}/settlements`);
      setSettlements(response.data);
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
      await axios.post(`${API_URL}/settlements`, formData);
      setIsModalOpen(false);
      setFormData({
        payerId: '', payeeId: '', amount: '', paymentMode: 'Bank Transfer', bankReference: '', agentHandledMoney: false, remarks: '', allocations: []
      });
      fetchSettlements();
      fetchInvoices();
    } catch (error) {
      console.error(error);
      alert('Failed to save settlement.');
    }
  };

  const addAllocation = () => {
    setFormData({
      ...formData,
      allocations: [...formData.allocations, { tradeInvoiceId: '', allocatedAmount: '' }]
    });
  };

  const updateAllocation = (index: number, field: string, value: string) => {
    const newAlloc = [...formData.allocations];
    newAlloc[index] = { ...newAlloc[index], [field]: value };
    setFormData({ ...formData, allocations: newAlloc });
  };

  const removeAllocation = (index: number) => {
    const newAlloc = formData.allocations.filter((_, i) => i !== index);
    setFormData({ ...formData, allocations: newAlloc });
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Settlement?')) return;
    try {
      await axios.delete(`${API_URL}/settlements/${id}`);
      if (typeof fetchInvoices === 'function' && typeof fetchInvoices !== 'undefined') fetchInvoices();
      if (typeof fetchNotes === 'function' && typeof fetchNotes !== 'undefined') fetchNotes();
      if (typeof fetchSettlements === 'function' && typeof fetchSettlements !== 'undefined') fetchSettlements();
      if (typeof fetchVouchers === 'function' && typeof fetchVouchers !== 'undefined') fetchVouchers();
      if (typeof fetchCommissions === 'function' && typeof fetchCommissions !== 'undefined') fetchCommissions();
      if (typeof fetchParties === 'function' && typeof fetchParties !== 'undefined') fetchParties();
    } catch (error) {
      console.error(error);
      alert('Failed to delete Settlement');
    }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Settlements</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Record payments and allocate against trade invoices.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Record Settlement
        </button>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Payer</th>
                <th>Payee</th>
                <th>Amount</th>
                <th>Unallocated</th>
                <th>Allocated Invoices</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((settlement: any) => (
                <tr key={settlement.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{settlement.referenceNumber}</span></td>
                  <td>{new Date(settlement.settlementDate).toLocaleDateString()}</td>
                  <td>{settlement.payer?.name}</td>
                  <td>{settlement.payee?.name}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>₹{Number(settlement.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>₹{Number(settlement.unallocatedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    {settlement.allocations.map((a: any) => (
                      <div key={a.id} style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Bill: {a.tradeInvoice?.supplierBillNumber || a.tradeInvoice?.voucherNumber}</span>: ₹{Number(a.allocatedAmount).toLocaleString()}
                      </div>
                    ))}
                  </td>
                  <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(settlement.id)}>Delete</button></td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No settlements recorded yet.
                  </td>
                  <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(settlement.id)}>Delete</button></td>
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
              <CreditCard size={24} /> Record Settlement
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Payer (Usually Buyer)</label>
                  <select required className="input-field" value={formData.payerId} onChange={e => setFormData({...formData, payerId: e.target.value})}>
                    <option value="">Select Payer...</option>
                    {parties.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Payee (Usually Supplier)</label>
                  <select required className="input-field" value={formData.payeeId} onChange={e => setFormData({...formData, payeeId: e.target.value})}>
                    <option value="">Select Payee...</option>
                    {parties.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Total Amount Paid</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Payment Mode</label>
                  <input required type="text" className="input-field" value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Bank Reference (UTR)</label>
                  <input type="text" className="input-field" value={formData.bankReference} onChange={e => setFormData({...formData, bankReference: e.target.value})} />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.agentHandledMoney} onChange={e => setFormData({...formData, agentHandledMoney: e.target.checked})} />
                  Agent handled this money (Check if you received/transferred this cash yourself)
                </label>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem' }}>Invoice Allocations</h3>
                  <button type="button" className="btn btn-outline" onClick={addAllocation} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>+ Add Allocation</button>
                </div>
                
                {formData.allocations.map((alloc, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Trade Invoice</label>
                      <select required className="input-field" value={alloc.tradeInvoiceId} onChange={e => updateAllocation(idx, 'tradeInvoiceId', e.target.value)}>
                        <option value="">Select Invoice...</option>
                        {invoices.filter((inv: any) => inv.status !== 'SETTLED' && (!formData.payerId || inv.buyerId === formData.payerId) && (!formData.payeeId || inv.supplierId === formData.payeeId)).map((inv: any) => {
                          const invTotal = inv.lines.reduce((s: number, l: any) => s + Number(l.lineTotal) + Number(l.taxAmount), 0);
                          const allocated = inv.allocations.reduce((s: number, a: any) => s + Number(a.allocatedAmount), 0);
                          return (
                            <option key={inv.id} value={inv.id}>
                              {inv.supplierBillNumber ? `Bill: ${inv.supplierBillNumber} (Inv: ${inv.voucherNumber})` : inv.voucherNumber} - Bal: ₹{(invTotal - allocated).toLocaleString()}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Amount to Allocate</label>
                      <input required type="number" step="0.01" className="input-field" value={alloc.allocatedAmount} onChange={e => updateAllocation(idx, 'allocatedAmount', e.target.value)} />
                    </div>
                    <div style={{ paddingTop: '1.25rem' }}>
                      <button type="button" onClick={() => removeAllocation(idx)} style={{ color: 'var(--color-danger)', padding: '0.5rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Settlement</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
