import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Building2, UserCircle, Calendar, Tag, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [parties, setParties] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  
  // Date Range State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
    fetchPartiesAndInvoices();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics`);
      setData(response.data);
    } catch (error) { console.error(error); }
  };

  const fetchPartiesAndInvoices = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        axios.get(`${API_URL}/parties`),
        axios.get(`${API_URL}/invoices`)
      ]);
      setParties(pRes.data);
      setInvoices(iRes.data);
    } catch (error) { console.error(error); }
  };

  if (!data || parties.length === 0) return <div style={{ padding: '2rem' }}>Loading Analytics...</div>;

  const totalOutstanding = data.aging.notDue + data.aging.days30 + data.aging.days60 + data.aging.days90 + data.aging.over90;

  // Filter invoices based on date range
  const filteredInvoices = invoices.filter(inv => {
    const d = new Date(inv.billDate);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate)) return false;
    return true;
  });

  // Calculate Party Specific Analytics from Filtered
  const selectedParty = parties.find(p => p.id === selectedPartyId);
  let partyMetrics = {
    totalTradeValue: 0,
    totalOutstanding: 0,
    totalReturns: 0,
    invoiceCount: 0
  };

  if (selectedParty) {
    const partyInvoices = filteredInvoices.filter(inv => inv.supplierId === selectedPartyId || inv.buyerId === selectedPartyId);
    partyMetrics.invoiceCount = partyInvoices.length;

    partyInvoices.forEach(inv => {
      const totalAmount = inv.lines.reduce((s: number, l: any) => s + Number(l.lineTotal) + Number(l.taxAmount), 0);
      partyMetrics.totalTradeValue += totalAmount;

      const allocated = inv.allocations.reduce((s: number, a: any) => s + Number(a.allocatedAmount), 0);
      
      let adjustmentsTotal = 0;
      let returnTotal = 0;
      inv.adjustmentNotes?.forEach((n: any) => {
        if (n.adjustmentDirection === 'INCREASE') adjustmentsTotal += Number(n.totalAdjustmentAmount);
        if (n.adjustmentDirection === 'DECREASE') {
          adjustmentsTotal -= Number(n.totalAdjustmentAmount);
          returnTotal += Number(n.totalAdjustmentAmount);
        }
      });
      partyMetrics.totalReturns += returnTotal;

      const outstanding = (totalAmount + adjustmentsTotal) - allocated;
      if (outstanding > 0) partyMetrics.totalOutstanding += outstanding;
    });
  }

  // Calculate Rate Books from Filtered Invoices
  const itemStats: Record<string, { meters: number, totalValue: number }> = {};
  filteredInvoices.forEach(inv => {
    inv.lines?.forEach((l: any) => {
      const name = l.itemDescription.trim() || 'Unknown Item';
      if (!itemStats[name]) itemStats[name] = { meters: 0, totalValue: 0 };
      itemStats[name].meters += Number(l.quantityMeters);
      itemStats[name].totalValue += (Number(l.quantityMeters) * Number(l.ratePerMeter));
    });
  });

  const rateBooks = Object.keys(itemStats).map(key => ({
    item: key,
    meters: itemStats[key].meters,
    avgRate: itemStats[key].meters > 0 ? (itemStats[key].totalValue / itemStats[key].meters) : 0
  })).sort((a, b) => b.meters - a.meters);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Actionable insights, rate books, and performance trends.</p>
        </div>
      </div>
      
      {/* Date Range Filter */}
      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', backgroundColor: 'var(--color-surface)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}><Calendar size={12} style={{marginRight: '4px'}}/> From Date</label>
          <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}><Calendar size={12} style={{marginRight: '4px'}}/> To Date</label>
          <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <button className="btn btn-outline" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear Dates</button>
        </div>
      </div>

      {/* Party Drill-Down Analytics */}
      <div className="premium-card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <UserCircle color="var(--color-primary)" size={28} />
          <h2 style={{ fontSize: '1.5rem' }}>Party Performance Drill-down</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={16} />
            <select className="input-field" style={{ paddingLeft: '2.5rem', fontWeight: 600 }} value={selectedPartyId} onChange={e => setSelectedPartyId(e.target.value)}>
              <option value="">Select a Party to view detailed analytics...</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>
        </div>

        {selectedPartyId ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Trade Volume</p>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--color-text-main)' }}>₹{partyMetrics.totalTradeValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Across {partyMetrics.invoiceCount} invoices</p>
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Outstanding / Unsettled</p>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--color-danger)' }}>₹{partyMetrics.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Current pending balance</p>
            </div>
            <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Returns & Adjustments</p>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--color-warning)' }}>₹{partyMetrics.totalReturns.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Value decreased due to notes</p>
            </div>
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            Please select a party from the dropdown above to view their individual analytics.
          </div>
        )}
      </div>

      {/* Rate Books */}
      <div className="premium-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Tag color="var(--color-text-muted)" />
          <h2 style={{ fontSize: '1.25rem' }}>Item Rate Book (Average Pricing)</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item / Fabric</th>
                <th>Total Meters Sold</th>
                <th>Avg. Rate / Meter (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rateBooks.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{item.item}</td>
                  <td>{item.meters.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>₹{item.avgRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {rateBooks.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>No items found in selected period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Aging Report Card */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Clock color="var(--color-text-muted)" />
            <h2 style={{ fontSize: '1.25rem' }}>Agency Receivables Aging</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Not Due Yet', value: data.aging.notDue, color: '#2b8a3e' },
              { label: '1 - 30 Days Overdue', value: data.aging.days30, color: '#fcc419' },
              { label: '31 - 60 Days Overdue', value: data.aging.days60, color: '#f59f00' },
              { label: '61 - 90 Days Overdue', value: data.aging.days90, color: '#e8590c' },
              { label: 'More than 90 Days Overdue', value: data.aging.over90, color: '#c92a2a' },
            ].map((bucket, idx) => {
              const percentage = totalOutstanding > 0 ? (bucket.value / totalOutstanding) * 100 : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500 }}>{bucket.label}</span>
                    <span style={{ fontWeight: 600 }}>₹{bucket.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'var(--color-surface-hover)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, backgroundColor: bucket.color, height: '100%', transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Outstanding:</span>
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Top Suppliers by Trade Volume */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Building2 color="var(--color-text-muted)" />
            <h2 style={{ fontSize: '1.25rem' }}>Top Suppliers (Trade Vol)</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.topSuppliersTrade?.map((supplier: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, display: 'block' }}>{supplier.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{supplier.invoiceCount} invoices</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>₹{supplier.totalTrade.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Buyers by Trade Volume */}
        <div className="premium-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp color="var(--color-text-muted)" />
            <h2 style={{ fontSize: '1.25rem' }}>Top Buyers (Trade Vol)</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.topBuyersTrade?.map((buyer: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, display: 'block' }}>{buyer.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{buyer.invoiceCount} invoices</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>₹{buyer.totalTrade.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
