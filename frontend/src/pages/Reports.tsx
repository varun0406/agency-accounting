import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Reports() {
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partiesRes, invoicesRes, notesRes] = await Promise.all([
        axios.get(`${API_URL}/parties`),
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/notes`)
      ]);
      setParties(partiesRes.data);
      setInvoices(invoicesRes.data);
      setNotes(notesRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getPartyLedger = (partyId: string) => {
    // This is a naive client-side calculation for demonstration of Phase 1 requirements
    const partyInvoices = invoices.filter((i: any) => i.buyerId === partyId || i.supplierId === partyId);
    
    let balance = 0; // Negative = Payable, Positive = Receivable (from perspective of the party)
    
    const ledgerEntries = partyInvoices.map((inv: any) => {
      const isBuyer = inv.buyerId === partyId;
      const totalAmount = inv.lines.reduce((s: number, l: any) => s + Number(l.lineTotal) + Number(l.taxAmount), 0);
      const allocated = inv.allocations.reduce((s: number, a: any) => s + Number(a.allocatedAmount), 0);
      
      // Calculate Notes for this invoice
      const invNotes = notes.filter((n: any) => n.tradeInvoiceId === inv.id);
      let adjustmentsTotal = 0;
      invNotes.forEach((n: any) => {
        if (n.adjustmentDirection === 'INCREASE') adjustmentsTotal += Number(n.totalAdjustmentAmount);
        if (n.adjustmentDirection === 'DECREASE') adjustmentsTotal -= Number(n.totalAdjustmentAmount);
      });
      
      const outstanding = (totalAmount + adjustmentsTotal) - allocated;
      if (isBuyer) balance -= outstanding;
      else balance += outstanding;

      return {
        ...inv,
        totalAmount: totalAmount + adjustmentsTotal,
        outstanding,
        roleInTransaction: isBuyer ? 'BUYER' : 'SUPPLIER'
      };
    });

    return { ledgerEntries, balance };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Reports & Party Ledgers</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Bill-wise outstanding and party balances.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {parties.map((party: any) => {
          const { ledgerEntries, balance } = getPartyLedger(party.id);
          
          if (ledgerEntries.length === 0) return null;

          return (
            <div key={party.id} className="premium-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem' }}>{party.name} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>({party.code})</span></h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Role: {party.role}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Net Trade Balance</p>
                  <h3 style={{ color: balance < 0 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '1.5rem' }}>
                    {balance < 0 ? 'Payable: ' : 'Receivable: '} ₹{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Voucher</th>
                      <th>Date</th>
                      <th>Role in Trade</th>
                      <th>Total Value</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.map((entry: any) => (
                      <tr key={entry.id}>
                        <td><span style={{ fontFamily: 'monospace' }}>{entry.type === 'INVOICE' && entry.raw.supplierBillNumber ? entry.raw.supplierBillNumber : entry.voucherNumber}</span></td>
                        <td>{new Date(entry.billDate).toLocaleDateString()}</td>
                        <td>{entry.roleInTransaction}</td>
                        <td>₹{entry.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 600 }}>₹{entry.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`badge ${entry.status === 'SETTLED' ? 'badge-success' : 'badge-warning'}`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
