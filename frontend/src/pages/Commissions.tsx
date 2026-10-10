import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Percent } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Commissions() {
  const [parties, setParties] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchParties();
    fetchInvoices();
  }, []);

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

  const suppliers = parties.filter(p => p.role === 'SUPPLIER');
  
  const commissionLedger = suppliers.map(supplier => {
    const supplierInvoices = invoices.filter(inv => inv.supplierId === supplier.id);
    let totalSales = 0;
    let totalAdjustments = 0;
    
    supplierInvoices.forEach(inv => {
      const invTotal = inv.lines.reduce((s: number, l: any) => s + Number(l.lineTotal) + Number(l.taxAmount), 0);
      totalSales += invTotal;

      inv.adjustmentNotes?.forEach((n: any) => {
        if (n.adjustmentDirection === 'INCREASE') totalAdjustments += Number(n.totalAdjustmentAmount);
        if (n.adjustmentDirection === 'DECREASE') totalAdjustments -= Number(n.totalAdjustmentAmount);
      });
    });

    const netSales = totalSales + totalAdjustments;
    const rate = Number(supplier.commissionRate) || 0;
    const commissionOwed = netSales * (rate / 100);

    return {
      ...supplier,
      invoiceCount: supplierInvoices.length,
      netSales,
      commissionRate: rate,
      commissionOwed
    };
  }).filter(s => s.netSales > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Percent size={28} color="var(--color-primary)" /> Auto-Commission Ledger
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Dynamically calculates your earned commission based on the Net Trade Value (Invoices ± Adjustments).</p>
        </div>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Invoices Tracked</th>
                <th>Net Trade Value</th>
                <th>Commission Rate (%)</th>
                <th>Total Earned (₹)</th>
              </tr>
            </thead>
            <tbody>
              {commissionLedger.map(comm => (
                <tr key={comm.id}>
                  <td style={{ fontWeight: 600 }}>{comm.name}</td>
                  <td>{comm.invoiceCount}</td>
                  <td>₹{comm.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{comm.commissionRate}%</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    ₹{comm.commissionOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {commissionLedger.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No trade volume found for suppliers. Set a Default Commission Rate in the Parties page to see auto-calculations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
