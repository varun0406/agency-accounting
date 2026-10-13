import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FileText, Layers, Trash2, ClipboardPaste, Check } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface BulkRow {
  id: string;
  supplierId: string;
  buyerId: string;
  supplierBillNumber: string;
  billDate: string;
  amount: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Single invoice form state
  const [formData, setFormData] = useState({
    supplierId: '',
    buyerId: '',
    supplierBillNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    lines: [
      { itemDescription: 'Cloth Material', quantityMeters: '', ratePerMeter: '', discount: '', gstRate: '5', otherCharges: '' }
    ]
  });

  // Bulk creation state
  const todayStr = new Date().toISOString().split('T')[0];
  const createEmptyRow = (dateStr = todayStr): BulkRow => ({
    id: Math.random().toString(36).substring(2, 9),
    supplierId: '',
    buyerId: '',
    supplierBillNumber: '',
    billDate: dateStr,
    amount: ''
  });

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow()
  ]);
  const [batchDate, setBatchDate] = useState(todayStr);
  const [bulkActiveTab, setBulkActiveTab] = useState<'grid' | 'paste'>('grid');
  const [pastedText, setPastedText] = useState('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

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
        lines: [{ itemDescription: 'Cloth Material', quantityMeters: '', ratePerMeter: '', discount: '', gstRate: '5', otherCharges: '' }]
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
      lines: [...formData.lines, { itemDescription: 'Cloth Material', quantityMeters: '', ratePerMeter: '', discount: '', gstRate: '5', otherCharges: '' }]
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
      fetchInvoices();
    } catch (error) {
      console.error(error);
      alert('Failed to delete Invoice');
    }
  };

  // Bulk Row Handlers
  const handleBulkRowChange = (id: string, field: keyof BulkRow, val: string) => {
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleAddBulkRow = (count = 1) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow(batchDate));
    setBulkRows(prev => [...prev, ...newRows]);
  };

  const handleRemoveBulkRow = (id: string) => {
    setBulkRows(prev => prev.filter(r => r.id !== id));
  };

  const applyBatchDateToAll = () => {
    if (!batchDate) return;
    setBulkRows(prev => prev.map(r => ({ ...r, billDate: batchDate })));
  };

  // Parse Excel / TSV / CSV paste
  const handleParsePaste = () => {
    if (!pastedText.trim()) return;
    const lines = pastedText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsed: BulkRow[] = [];

    lines.forEach(line => {
      // split by tab first (Excel copy), otherwise comma
      let cols = line.includes('\t') ? line.split('\t') : line.split(',');
      cols = cols.map(c => c.trim());
      if (cols.length >= 2) {
        const rawSupplier = cols[0];
        const rawBuyer = cols[1];
        const rawAmount = cols[2]?.replace(/[^0-9.]/g, '') || '';
        const rawDate = cols[3] || batchDate;
        const rawBillNo = cols[4] || '';

        // Match supplier
        const matchedSup = parties.find(p => 
          p.name.toLowerCase() === rawSupplier.toLowerCase() ||
          p.code.toLowerCase() === rawSupplier.toLowerCase() ||
          p.name.toLowerCase().includes(rawSupplier.toLowerCase())
        );

        // Match buyer
        const matchedBuy = parties.find(p => 
          p.name.toLowerCase() === rawBuyer.toLowerCase() ||
          p.code.toLowerCase() === rawBuyer.toLowerCase() ||
          p.name.toLowerCase().includes(rawBuyer.toLowerCase())
        );

        parsed.push({
          id: Math.random().toString(36).substring(2, 9),
          supplierId: matchedSup ? matchedSup.id : '',
          buyerId: matchedBuy ? matchedBuy.id : '',
          amount: rawAmount,
          billDate: rawDate && !isNaN(Date.parse(rawDate)) ? rawDate : batchDate,
          supplierBillNumber: rawBillNo
        });
      }
    });

    if (parsed.length > 0) {
      setBulkRows(prev => [...prev.filter(r => r.supplierId && r.amount), ...parsed]);
      setBulkActiveTab('grid');
      setPastedText('');
    } else {
      alert('Could not parse any rows. Ensure format is: Supplier [Tab] Buyer [Tab] Amount [Tab] Date [Tab] BillNo');
    }
  };

  const handleBulkSubmit = async () => {
    // Filter only rows that have supplier, buyer, and amount
    const validRows = bulkRows.filter(r => r.supplierId && r.buyerId && Number(r.amount) > 0);
    if (validRows.length === 0) {
      alert('Please fill at least one row with Supplier, Buyer, and an Amount greater than 0.');
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const payload = validRows.map(r => ({
        supplierId: r.supplierId,
        buyerId: r.buyerId,
        amount: Number(r.amount),
        billDate: r.billDate || batchDate,
        supplierBillNumber: r.supplierBillNumber || null
      }));

      const res = await axios.post(`${API_URL}/invoices/bulk`, { invoices: payload });
      setBulkSuccessMsg(`Successfully created ${res.data.count || validRows.length} trade invoices!`);
      fetchInvoices();
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkSuccessMsg('');
        setBulkRows([createEmptyRow(), createEmptyRow(), createEmptyRow(), createEmptyRow(), createEmptyRow()]);
      }, 1200);
    } catch (error: any) {
      console.error('Error submitting bulk invoices:', error);
      alert('Failed to save bulk invoices: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Filter invoices for display
  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.voucherNumber?.toLowerCase().includes(q) ||
      inv.supplierBillNumber?.toLowerCase().includes(q) ||
      inv.supplier?.name?.toLowerCase().includes(q) ||
      inv.buyer?.name?.toLowerCase().includes(q)
    );
  });

  const validRowCount = bulkRows.filter(r => r.supplierId && r.buyerId && Number(r.amount) > 0).length;
  const bulkTotalAmount = bulkRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Trade Invoices</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Track supplier-to-buyer cloth trade bills.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setIsBulkModalOpen(true)}
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-primary)', fontWeight: 600 }}
          >
            <Layers size={16} /> Bulk Invoice Creation
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Trade Invoice
          </button>
        </div>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search invoices by voucher, supplier bill no, supplier or buyer name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                <th>Supplier (Seller)</th>
                <th>Buyer (Customer)</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv: any) => {
                const total = inv.lines?.reduce((sum: number, line: any) => sum + Number(line.lineTotal) + Number(line.taxAmount), 0) || 0;
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
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    {searchQuery ? 'No matching invoices found.' : 'No invoices recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE INVOICE MODAL */}
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
              <FileText size={24} /> Record Single Trade Invoice
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Supplier (Seller)</label>
                  <select required className="input-field" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Select Supplier...</option>
                    {parties.filter((p: any) => p.role === 'SUPPLIER' || p.role === 'BOTH').map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Buyer (Purchaser)</label>
                  <select required className="input-field" value={formData.buyerId} onChange={e => setFormData({...formData, buyerId: e.target.value})}>
                    <option value="">Select Buyer...</option>
                    {parties.filter((p: any) => p.role === 'BUYER' || p.role === 'BOTH').map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Supplier Bill No (Optional)</label>
                  <input type="text" className="input-field" value={formData.supplierBillNumber} placeholder="e.g. Bill #1042" onChange={e => setFormData({...formData, supplierBillNumber: e.target.value})} />
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
                  <h3 style={{ fontSize: '1rem' }}>Bill Details / Line Items</h3>
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
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Meters / Quantity</label>
                        <input required type="number" step="0.01" className="input-field" value={line.quantityMeters} onChange={e => updateLine(idx, 'quantityMeters', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Rate / Mtr (₹)</label>
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
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Other Charges (₹)</label>
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

      {/* BULK INVOICE CREATION MODAL */}
      {isBulkModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="premium-card" 
            style={{ padding: '2rem', width: '96%', maxWidth: '1100px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={24} color="var(--color-primary)" /> Quick Bulk Invoice Creation
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  Enter multiple trade invoices quickly with just Parties, Amount, Date and optional Bill Number.
                </p>
              </div>
              <button 
                onClick={() => setIsBulkModalOpen(false)} 
                style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
                ✕
              </button>
            </div>

            {/* Mode Switcher & Batch Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={`btn ${bulkActiveTab === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
                  onClick={() => setBulkActiveTab('grid')}
                >
                  Grid Table Entry
                </button>
                <button 
                  className={`btn ${bulkActiveTab === 'paste' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
                  onClick={() => setBulkActiveTab('paste')}
                >
                  <ClipboardPaste size={15} /> Paste from Excel / Text
                </button>
              </div>

              {bulkActiveTab === 'grid' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Batch Date:</span>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={batchDate} 
                    onChange={e => setBatchDate(e.target.value)} 
                    style={{ padding: '0.35rem 0.5rem', width: '145px', fontSize: '0.825rem' }} 
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={applyBatchDateToAll}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    title="Apply this date to all rows below"
                  >
                    Apply Date to All Rows
                  </button>
                </div>
              )}
            </div>

            {/* Success notification */}
            {bulkSuccessMsg && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#d3f9d8', color: '#2b8a3e', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Check size={18} /> {bulkSuccessMsg}
              </div>
            )}

            {/* TAB 1: Grid Table Entry */}
            {bulkActiveTab === 'grid' && (
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '25%' }}>Supplier (Seller) *</th>
                      <th style={{ width: '25%' }}>Buyer (Customer) *</th>
                      <th style={{ width: '16%' }}>Bill No (Optional)</th>
                      <th style={{ width: '16%' }}>Date *</th>
                      <th style={{ width: '14%' }}>Amount (₹) *</th>
                      <th style={{ width: '40px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, index) => (
                      <tr key={row.id}>
                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          {index + 1}
                        </td>
                        <td>
                          <select 
                            className="input-field" 
                            value={row.supplierId} 
                            onChange={e => handleBulkRowChange(row.id, 'supplierId', e.target.value)}
                            style={{ padding: '0.4rem 0.5rem', fontSize: '0.825rem' }}
                          >
                            <option value="">Select Supplier...</option>
                            {parties.map(p => (
                              <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select 
                            className="input-field" 
                            value={row.buyerId} 
                            onChange={e => handleBulkRowChange(row.id, 'buyerId', e.target.value)}
                            style={{ padding: '0.4rem 0.5rem', fontSize: '0.825rem' }}
                          >
                            <option value="">Select Buyer...</option>
                            {parties.map(p => (
                              <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            placeholder="e.g. 504" 
                            className="input-field" 
                            value={row.supplierBillNumber} 
                            onChange={e => handleBulkRowChange(row.id, 'supplierBillNumber', e.target.value)}
                            style={{ padding: '0.4rem 0.5rem', fontSize: '0.825rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="date" 
                            className="input-field" 
                            value={row.billDate} 
                            onChange={e => handleBulkRowChange(row.id, 'billDate', e.target.value)}
                            style={{ padding: '0.4rem 0.5rem', fontSize: '0.825rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            placeholder="₹ Amount" 
                            step="0.01" 
                            className="input-field" 
                            value={row.amount} 
                            onChange={e => handleBulkRowChange(row.id, 'amount', e.target.value)}
                            style={{ padding: '0.4rem 0.5rem', fontSize: '0.825rem', fontWeight: 600 }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveBulkRow(row.id)}
                            style={{ color: 'var(--color-danger)', cursor: 'pointer', padding: '0.25rem' }}
                            title="Remove row"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add rows buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => handleAddBulkRow(1)}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    + Add 1 Row
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => handleAddBulkRow(5)}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    + Add 5 Rows
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setBulkRows(prev => prev.filter(r => r.supplierId || r.buyerId || r.amount))}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', marginLeft: 'auto', color: 'var(--color-text-muted)' }}
                  >
                    Remove Empty Rows
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Quick Paste Tab */}
            {bulkActiveTab === 'paste' && (
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.825rem' }}>
                  <strong>How to use Quick Paste:</strong>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Copy columns directly from your Excel sheet or type them separated by Tab or Comma:
                  </p>
                  <pre style={{ backgroundColor: 'var(--color-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    Supplier Name [Tab] Buyer Name [Tab] Amount [Tab] Date [Tab] BillNo{'\n'}
                    Example: Vardhman Textiles  Shree Ram Cloth  54000  2026-10-13  B-101
                  </pre>
                </div>

                <textarea
                  className="input-field"
                  rows={8}
                  placeholder={`Paste multiple lines from Excel or spreadsheet here...`}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />

                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleParsePaste}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <ClipboardPaste size={16} /> Parse & Load into Table
                </button>
              </div>
            )}

            {/* Footer Summary & Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Ready to save: </span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>{validRowCount} valid invoices</strong>
                <span style={{ margin: '0 0.5rem', color: 'var(--color-border)' }}>|</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Total Amount: </span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--color-success)' }}>
                  ₹{bulkTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsBulkModalOpen(false)}
                  disabled={isSubmittingBulk}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleBulkSubmit}
                  disabled={isSubmittingBulk || validRowCount === 0}
                  style={{ fontWeight: 600, minWidth: '160px' }}
                >
                  {isSubmittingBulk ? 'Saving Invoices...' : `Save All ${validRowCount} Invoices`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
