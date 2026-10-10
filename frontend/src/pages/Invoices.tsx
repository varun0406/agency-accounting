import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FileText } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [parties, setParties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    buyerId: '',
    supplierBillNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    lines: [
      { itemDescription: '', quantityMeters: '', ratePerMeter: '', discount: '', gstRate: '5', otherCharges: '' }
    ]
  });

  useEffect(() => {
    fetchInvoices();
    fetchParties();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

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
      await axios.post(`${API_URL}/invoices`, formData);
      setIsModalOpen(false);
      setFormData({
        supplierId: '', buyerId: '', supplierBillNumber: '', billDate: new Date().toISOString().split('T')[0], dueDate: '',
        lines: [{ itemDescription: '', quantityMeters: '', ratePerMeter: '', discount: '', gstRate: '5', otherCharges: '' }]
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice.');
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { itemDescription: '', quantityMeters: '', ratePerMeter: '', discount: '', gstRate: '5', otherCharges: '' }]
    });
  };

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const removeLine = (index: number) => {
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Invoice?')) return;
    try {
      await axios.delete(`${API_URL}/invoices/${id}`);
                                        } catch (error) {
      console.error(error);
      alert('Failed to delete Invoice');
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Trade Invoices</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Track supplier-to-buyer trade bills.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Trade Invoice
        </button>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search invoices by voucher or supplier bill no..." 
              style={{ paddingLeft: '2.5rem' }} 
            />
          </div>
        </div>

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => {
                const total = inv.lines.reduce((sum: number, line: any) => sum + Number(line.lineTotal) + Number(line.taxAmount), 0);
                return (
                  <tr key={inv.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)' }}>{inv.voucherNumber}</span></td>
                    <td><span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{inv.supplierBillNumber || '-'}</span></td>
                    <td>{new Date(inv.billDate).toLocaleDateString()}</td>
                    <td>{inv.supplier?.name}</td>
                    <td>{inv.buyer?.name}</td>
                    <td style={{ fontWeight: 600 }}>₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${inv.status === 'DRAFT' ? 'badge-neutral' : inv.status === 'POSTED' ? 'badge-warning' : 'badge-success'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td><button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', color: 'var(--color-danger)'}} onClick={() => handleDelete(inv.id)}>Delete</button></td>
                </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No invoices recorded.
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="premium-card" 
            style={{ padding: '2rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={24} /> Record Trade Invoice
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Supplier</label>
                  <select required className="input-field" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Select Supplier...</option>
                    {parties.filter((p: any) => p.role === 'SUPPLIER' ).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Buyer</label>
                  <select required className="input-field" value={formData.buyerId} onChange={e => setFormData({...formData, buyerId: e.target.value})}>
                    <option value="">Select Buyer...</option>
                    {parties.filter((p: any) => p.role === 'BUYER' ).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Supplier Bill No</label>
                  <input required type="text" className="input-field" value={formData.supplierBillNumber} onChange={e => setFormData({...formData, supplierBillNumber: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Bill Date</label>
                  <input required type="date" className="input-field" value={formData.billDate} onChange={e => setFormData({...formData, billDate: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Due Date (Optional)</label>
                  <input type="date" className="input-field" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem' }}>Line Items</h3>
                  <button type="button" className="btn btn-outline" onClick={addLine} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>+ Add Line</button>
                </div>
                
                {formData.lines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Item Description</label>
                        <input required type="text" className="input-field" value={line.itemDescription} onChange={e => updateLine(idx, 'itemDescription', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Meters</label>
                        <input required type="number" step="0.01" className="input-field" value={line.quantityMeters} onChange={e => updateLine(idx, 'quantityMeters', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Rate / Mtr</label>
                        <input required type="number" step="0.01" className="input-field" value={line.ratePerMeter} onChange={e => updateLine(idx, 'ratePerMeter', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Discount (₹)</label>
                        <input type="number" step="0.01" className="input-field" value={line.discount} onChange={e => updateLine(idx, 'discount', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GST %</label>
                        <select className="input-field" value={line.gstRate} onChange={e => updateLine(idx, 'gstRate', e.target.value)}>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Other Charges</label>
                        <input type="number" step="0.01" className="input-field" value={line.otherCharges} onChange={e => updateLine(idx, 'otherCharges', e.target.value)} />
                      </div>
                      <div>
                        <button type="button" onClick={() => removeLine(idx)} style={{ color: 'var(--color-danger)', padding: '0.5rem' }} disabled={formData.lines.length === 1}>
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Trade Invoice</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
