import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Printer, Download, Filter, Search, FileText, 
  Building2, IndianRupee, RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Reports() {
  const [parties, setParties] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);

  // Tabs: 'ledger' | 'outstanding'
  const [activeTab, setActiveTab] = useState<'ledger' | 'outstanding'>('ledger');

  // Filters
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL'); // ALL, BUYER, SUPPLIER
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, PENDING_OS, SETTLED
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [partiesRes, invoicesRes, notesRes, settlementsRes] = await Promise.all([
        axios.get(`${API_URL}/parties`),
        axios.get(`${API_URL}/invoices`),
        axios.get(`${API_URL}/notes`),
        axios.get(`${API_URL}/settlements`)
      ]);
      setParties(partiesRes.data);
      setInvoices(invoicesRes.data);
      setNotes(notesRes.data);
      setSettlements(settlementsRes.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedPartyId('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // ==========================================
  // 1. BILL-WISE OUTSTANDING (O/S) DATA
  // ==========================================
  const billWiseRecords = invoices.map(inv => {
    const rawTotal = inv.lines?.reduce((s: number, l: any) => s + Number(l.lineTotal) + Number(l.taxAmount), 0) || 0;
    
    // Notes linked to this invoice
    const invNotes = notes.filter(n => n.tradeInvoiceId === inv.id);
    let adjustmentsTotal = 0;
    invNotes.forEach(n => {
      if (n.adjustmentDirection === 'INCREASE') adjustmentsTotal += Number(n.totalAdjustmentAmount);
      if (n.adjustmentDirection === 'DECREASE') adjustmentsTotal -= Number(n.totalAdjustmentAmount);
    });

    const netBillAmount = Math.max(0, rawTotal + adjustmentsTotal);
    const allocated = inv.allocations?.reduce((s: number, a: any) => s + Number(a.allocatedAmount), 0) || 0;
    const outstanding = Math.max(0, netBillAmount - allocated);

    // Days overdue
    const billDateObj = new Date(inv.billDate);
    const dueDateObj = inv.dueDate ? new Date(inv.dueDate) : billDateObj;
    const now = new Date();
    const isOverdue = outstanding > 0 && dueDateObj < now;
    const daysOverdue = isOverdue ? Math.floor((now.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    let computedStatus = 'PENDING';
    if (outstanding <= 0.01) computedStatus = 'SETTLED';
    else if (isOverdue) computedStatus = 'OVERDUE';
    else if (allocated > 0) computedStatus = 'PARTIAL';

    return {
      id: inv.id,
      voucherNumber: inv.voucherNumber,
      supplierBillNumber: inv.supplierBillNumber || '-',
      billDate: inv.billDate,
      dueDate: inv.dueDate,
      supplier: inv.supplier,
      buyer: inv.buyer,
      supplierId: inv.supplierId,
      buyerId: inv.buyerId,
      rawTotal,
      adjustmentsTotal,
      netBillAmount,
      allocated,
      outstanding,
      isOverdue,
      daysOverdue,
      status: computedStatus
    };
  });

  // Filtered Bill-Wise Records
  const filteredBillWise = billWiseRecords.filter(item => {
    // Party filter
    if (selectedPartyId && item.supplierId !== selectedPartyId && item.buyerId !== selectedPartyId) {
      return false;
    }
    // Role filter
    if (roleFilter === 'BUYER' && selectedPartyId && item.buyerId !== selectedPartyId) return false;
    if (roleFilter === 'SUPPLIER' && selectedPartyId && item.supplierId !== selectedPartyId) return false;

    // Status filter
    if (statusFilter === 'PENDING_OS' && item.outstanding <= 0.01) return false;
    if (statusFilter === 'SETTLED' && item.outstanding > 0.01) return false;

    // Date filter
    const bDate = new Date(item.billDate);
    if (startDate && bDate < new Date(startDate)) return false;
    if (endDate && bDate > new Date(endDate)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVoucher = item.voucherNumber?.toLowerCase().includes(q);
      const matchBill = item.supplierBillNumber?.toLowerCase().includes(q);
      const matchSup = item.supplier?.name?.toLowerCase().includes(q);
      const matchBuy = item.buyer?.name?.toLowerCase().includes(q);
      if (!matchVoucher && !matchBill && !matchSup && !matchBuy) return false;
    }

    return true;
  });

  // Totals for Outstanding Report
  const totalOsBilled = filteredBillWise.reduce((s, i) => s + i.rawTotal, 0);
  const totalOsReturns = filteredBillWise.reduce((s, i) => s + Math.abs(i.adjustmentsTotal), 0);
  const totalOsNet = filteredBillWise.reduce((s, i) => s + i.netBillAmount, 0);
  const totalOsAllocated = filteredBillWise.reduce((s, i) => s + i.allocated, 0);
  const totalOsPending = filteredBillWise.reduce((s, i) => s + i.outstanding, 0);

  // ==========================================
  // 2. PARTY LEDGER STATEMENT (KHATA) DATA
  // ==========================================
  const buildPartyLedger = (party: any) => {
    const pId = party.id;

    // Transactions list
    const txns: any[] = [];

    // Opening Balance
    const opBal = Number(party.openingBalanceAmount) || 0;
    const opType = party.openingBalanceType || 'RECEIVABLE'; // 'RECEIVABLE' (Debit) or 'PAYABLE' (Credit)

    // 1. Invoices
    invoices.forEach(inv => {
      const isInvolved = inv.buyerId === pId || inv.supplierId === pId;
      if (!isInvolved) return;

      const totalVal = inv.lines?.reduce((s: number, l: any) => s + Number(l.lineTotal) + Number(l.taxAmount), 0) || 0;
      
      if (inv.buyerId === pId) {
        // Buyer purchased goods -> Debit (they owe money)
        txns.push({
          date: new Date(inv.billDate),
          ref: inv.voucherNumber,
          billNo: inv.supplierBillNumber || '-',
          particulars: `Trade Purchase / Bill (Supplier: ${inv.supplier?.name || '-'})`,
          debit: totalVal,
          credit: 0,
          type: 'INVOICE'
        });
      } else if (inv.supplierId === pId) {
        // Supplier sold goods -> Credit (payable to supplier)
        txns.push({
          date: new Date(inv.billDate),
          ref: inv.voucherNumber,
          billNo: inv.supplierBillNumber || '-',
          particulars: `Trade Sale / Bill (Buyer: ${inv.buyer?.name || '-'})`,
          debit: 0,
          credit: totalVal,
          type: 'INVOICE'
        });
      }
    });

    // 2. Sales Returns & Deductions (Notes)
    notes.forEach(note => {
      const isInvolved = note.buyerId === pId || note.supplierId === pId;
      if (!isInvolved) return;

      const amount = Number(note.totalAdjustmentAmount) || 0;
      const typeLabel = note.noteType.replace('_', ' ');

      if (note.buyerId === pId) {
        if (note.adjustmentDirection === 'DECREASE') {
          // Return / Discount for buyer -> Credit (reduces what buyer owes)
          txns.push({
            date: new Date(note.noteDate),
            ref: note.noteNumber,
            billNo: note.tradeInvoice?.supplierBillNumber || '-',
            particulars: `${typeLabel} - ${note.reason || 'Deduction'}`,
            debit: 0,
            credit: amount,
            type: 'NOTE'
          });
        } else {
          // Extra charge -> Debit
          txns.push({
            date: new Date(note.noteDate),
            ref: note.noteNumber,
            billNo: note.tradeInvoice?.supplierBillNumber || '-',
            particulars: `${typeLabel} - ${note.reason || 'Additional charge'}`,
            debit: amount,
            credit: 0,
            type: 'NOTE'
          });
        }
      } else if (note.supplierId === pId) {
        if (note.adjustmentDirection === 'DECREASE') {
          // Reduces supplier payable -> Debit
          txns.push({
            date: new Date(note.noteDate),
            ref: note.noteNumber,
            billNo: note.tradeInvoice?.supplierBillNumber || '-',
            particulars: `${typeLabel} - ${note.reason || 'Deduction'}`,
            debit: amount,
            credit: 0,
            type: 'NOTE'
          });
        } else {
          txns.push({
            date: new Date(note.noteDate),
            ref: note.noteNumber,
            billNo: note.tradeInvoice?.supplierBillNumber || '-',
            particulars: `${typeLabel} - ${note.reason || 'Addition'}`,
            debit: 0,
            credit: amount,
            type: 'NOTE'
          });
        }
      }
    });

    // 3. Payments & Settlements
    settlements.forEach(sett => {
      const isPayer = sett.payerId === pId;
      const isPayee = sett.payeeId === pId;
      if (!isPayer && !isPayee) return;

      const amount = Number(sett.amount) || 0;

      if (isPayer) {
        // Party paid money -> Credit (reduces their outstanding debit)
        txns.push({
          date: new Date(sett.settlementDate),
          ref: sett.referenceNumber,
          billNo: sett.bankReference || '-',
          particulars: `Payment Made (${sett.paymentMode || 'Bank'}) to ${sett.payee?.name || '-'}`,
          debit: 0,
          credit: amount,
          type: 'PAYMENT'
        });
      } else if (isPayee) {
        // Party received payment -> Debit (reduces their credit balance)
        txns.push({
          date: new Date(sett.settlementDate),
          ref: sett.referenceNumber,
          billNo: sett.bankReference || '-',
          particulars: `Payment Received (${sett.paymentMode || 'Bank'}) from ${sett.payer?.name || '-'}`,
          debit: amount,
          credit: 0,
          type: 'PAYMENT'
        });
      }
    });

    // Sort chronologically
    txns.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply date filtering
    const filteredTxns = txns.filter(t => {
      if (startDate && t.date < new Date(startDate)) return false;
      if (endDate && t.date > new Date(endDate)) return false;
      return true;
    });

    // Calculate Running Balance
    let running = (opType === 'RECEIVABLE' ? opBal : -opBal);
    let totalDebits = 0;
    let totalCredits = 0;

    const entriesWithRunning = filteredTxns.map(t => {
      totalDebits += t.debit;
      totalCredits += t.credit;
      running += (t.debit - t.credit);
      return {
        ...t,
        runningBalance: running
      };
    });

    const netClosing = running;

    return {
      party,
      opBal,
      opType,
      entries: entriesWithRunning,
      totalDebits,
      totalCredits,
      netClosing
    };
  };

  // Determine which parties to show in ledger mode
  const eligibleParties = parties.filter(p => {
    if (selectedPartyId && p.id !== selectedPartyId) return false;
    if (roleFilter === 'BUYER' && p.role !== 'BUYER' && p.role !== 'BOTH') return false;
    if (roleFilter === 'SUPPLIER' && p.role !== 'SUPPLIER' && p.role !== 'BOTH') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ==========================================
  // EXPORT TO CSV / EXCEL
  // ==========================================
  const handleExportCSV = () => {
    if (activeTab === 'outstanding') {
      // Export Outstanding Report
      let csv = '\uFEFF'; // UTF-8 BOM
      csv += 'BILL-WISE OUTSTANDING (O/S) REPORT\n';
      csv += `Generated On: ${new Date().toLocaleString()}\n`;
      if (startDate || endDate) csv += `Period: ${startDate || 'Start'} to ${endDate || 'End'}\n`;
      csv += '\n';
      csv += 'Bill Date,Supplier Bill No,Voucher No,Supplier (Creditor),Buyer (Debtor),Due Date,Days Overdue,Total Bill Amount (Rs),Returns & Deductions (Rs),Net Bill Amount (Rs),Settled / Paid (Rs),Outstanding O/S Due (Rs),Status\n';

      filteredBillWise.forEach(row => {
        csv += `"${new Date(row.billDate).toLocaleDateString()}",`;
        csv += `"${row.supplierBillNumber}",`;
        csv += `"${row.voucherNumber}",`;
        csv += `"${row.supplier?.name || '-'}",`;
        csv += `"${row.buyer?.name || '-'}",`;
        csv += `"${row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}",`;
        csv += `"${row.daysOverdue}",`;
        csv += `${row.rawTotal.toFixed(2)},`;
        csv += `${Math.abs(row.adjustmentsTotal).toFixed(2)},`;
        csv += `${row.netBillAmount.toFixed(2)},`;
        csv += `${row.allocated.toFixed(2)},`;
        csv += `${row.outstanding.toFixed(2)},`;
        csv += `"${row.status}"\n`;
      });

      csv += '\nTOTALS,,,,,,';
      csv += `${totalOsBilled.toFixed(2)},`;
      csv += `${totalOsReturns.toFixed(2)},`;
      csv += `${totalOsNet.toFixed(2)},`;
      csv += `${totalOsAllocated.toFixed(2)},`;
      csv += `${totalOsPending.toFixed(2)},\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill_Wise_Outstanding_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Export Party Ledgers
      let csv = '\uFEFF'; // UTF-8 BOM
      csv += 'PARTY STATEMENT OF ACCOUNT (LEDGER)\n';
      csv += `Generated On: ${new Date().toLocaleString()}\n`;
      if (startDate || endDate) csv += `Period: ${startDate || 'Start'} to ${endDate || 'End'}\n`;
      csv += '\n';

      eligibleParties.forEach(p => {
        const ledger = buildPartyLedger(p);
        if (ledger.entries.length === 0 && ledger.opBal === 0) return;

        csv += `PARTY: "${p.name}" (${p.code}) | Role: ${p.role} | GSTIN: ${p.gstin || '-'} | Phone: ${p.mobile || '-'}\n`;
        csv += `Opening Balance: Rs ${ledger.opBal.toFixed(2)} (${ledger.opType})\n`;
        csv += 'Date,Ref / Voucher,Bill No,Particulars,Debit (Rs),Credit (Rs),Running Balance (Rs)\n';

        ledger.entries.forEach(e => {
          csv += `"${new Date(e.date).toLocaleDateString()}",`;
          csv += `"${e.ref}",`;
          csv += `"${e.billNo}",`;
          csv += `"${e.particulars.replace(/"/g, '""')}",`;
          csv += `${e.debit ? e.debit.toFixed(2) : '0.00'},`;
          csv += `${e.credit ? e.credit.toFixed(2) : '0.00'},`;
          csv += `${e.runningBalance.toFixed(2)}\n`;
        });

        csv += `Total Debits: Rs ${ledger.totalDebits.toFixed(2)}, Total Credits: Rs ${ledger.totalCredits.toFixed(2)}, Net Closing Balance: Rs ${Math.abs(ledger.netClosing).toFixed(2)} ${ledger.netClosing >= 0 ? '(Receivable)' : '(Payable)'}\n\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Party_Ledger_Statement_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ==========================================
  // PRINT / PDF
  // ==========================================
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* SCREEN HEADER */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Reports & Statements</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Party Ledgers, Statement of Accounts & Bill-Wise Outstanding (O/S).</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleExportCSV}
            style={{ fontWeight: 600, backgroundColor: 'var(--color-surface)' }}
          >
            <Download size={16} /> Export to Excel / CSV
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            style={{ fontWeight: 600 }}
          >
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('ledger')}
          style={{ fontWeight: 600, fontSize: '0.875rem' }}
        >
          <FileText size={16} /> Party Ledger Statement (Khata)
        </button>
        <button
          className={`btn ${activeTab === 'outstanding' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('outstanding')}
          style={{ fontWeight: 600, fontSize: '0.875rem' }}
        >
          <IndianRupee size={16} /> Bill-Wise Outstanding (O/S) Report
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="premium-card no-print" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={16} color="var(--color-primary)" />
          <strong style={{ fontSize: '0.9rem' }}>Filter Options</strong>
          {(selectedPartyId || roleFilter !== 'ALL' || statusFilter !== 'ALL' || startDate || endDate || searchQuery) && (
            <button 
              onClick={handleResetFilters}
              style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <RefreshCw size={12} /> Reset Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Party Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              Select Party
            </label>
            <select 
              className="input-field" 
              value={selectedPartyId} 
              onChange={e => setSelectedPartyId(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            >
              <option value="">All Parties</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              Party Role
            </label>
            <select 
              className="input-field" 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Roles (Buyers & Suppliers)</option>
              <option value="BUYER">Buyers (Debtors) Only</option>
              <option value="SUPPLIER">Suppliers (Creditors) Only</option>
            </select>
          </div>

          {/* Status Filter (Especially for Outstanding) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              Outstanding Status
            </label>
            <select 
              className="input-field" 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Bills</option>
              <option value="PENDING_OS">Pending / Unpaid (O/S &gt; 0)</option>
              <option value="SETTLED">Fully Settled (Paid)</option>
            </select>
          </div>

          {/* Date Range: From */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              From Date
            </label>
            <input 
              type="date" 
              className="input-field" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Date Range: To */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              To Date
            </label>
            <input 
              type="date" 
              className="input-field" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Search Box */}
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              Search Bills / Parties
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Bill no, voucher, name..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '0.5rem 0.5rem 0.5rem 2.25rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY FORMAL LETTERHEAD */}
      <div className="print-only print-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '18pt', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              AGENCY ACCOUNTING SYSTEM
            </h1>
            <p style={{ fontSize: '9pt', color: '#555', margin: '2px 0 0 0' }}>
              Commission Agency & Textile Trade Accounting
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8.5pt' }}>
            <p style={{ margin: 0 }}><strong>Date Printed:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            {(startDate || endDate) && (
              <p style={{ margin: '2px 0 0 0' }}><strong>Period:</strong> {startDate || 'Beginning'} to {endDate || 'Today'}</p>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 700, margin: 0, textDecoration: 'underline' }}>
            {activeTab === 'ledger' ? 'PARTY STATEMENT OF ACCOUNT / LEDGER' : 'BILL-WISE OUTSTANDING (O/S) STATEMENT'}
          </h2>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: BILL-WISE OUTSTANDING (O/S) REPORT                */}
      {/* ========================================================= */}
      {activeTab === 'outstanding' && (
        <div>
          {/* Outstanding Summary Metric Cards */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="premium-card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Invoiced</p>
              <h3 style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>₹{totalOsBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{filteredBillWise.length} Bills Tracked</span>
            </div>
            <div className="premium-card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Returns &amp; Deductions</p>
              <h3 style={{ fontSize: '1.35rem', marginTop: '0.25rem', color: 'var(--color-danger)' }}>-₹{totalOsReturns.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Net Billed: ₹{totalOsNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="premium-card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Payments Received / Paid</p>
              <h3 style={{ fontSize: '1.35rem', marginTop: '0.25rem', color: 'var(--color-success)' }}>₹{totalOsAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Settled towards Bills</span>
            </div>
            <div className="premium-card" style={{ padding: '1.25rem', borderColor: 'var(--color-danger)', backgroundColor: '#fff8f8' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)', textTransform: 'uppercase', fontWeight: 700 }}>Total Outstanding Due</p>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--color-danger)', fontWeight: 800 }}>
                ₹{totalOsPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                {filteredBillWise.filter(i => i.outstanding > 0.01).length} Unsettled Bills
              </span>
            </div>
          </div>

          {/* Outstanding Table */}
          <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill Date</th>
                    <th>Supplier Bill No</th>
                    <th>Voucher</th>
                    <th>Supplier (Creditor)</th>
                    <th>Buyer (Debtor)</th>
                    <th style={{ textAlign: 'right' }}>Total Bill (₹)</th>
                    <th style={{ textAlign: 'right' }}>Returns / Ded (₹)</th>
                    <th style={{ textAlign: 'right' }}>Net Bill (₹)</th>
                    <th style={{ textAlign: 'right' }}>Paid (₹)</th>
                    <th style={{ textAlign: 'right' }}>Outstanding O/S (₹)</th>
                    <th>Due / Overdue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillWise.map(bill => (
                    <tr key={bill.id}>
                      <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                      <td>
                        <strong style={{ color: 'var(--color-primary)' }}>{bill.supplierBillNumber}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{bill.voucherNumber}</span>
                      </td>
                      <td>{bill.supplier?.name}</td>
                      <td>{bill.buyer?.name}</td>
                      <td style={{ textAlign: 'right' }}>₹{bill.rawTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: bill.adjustmentsTotal < 0 ? 'var(--color-danger)' : 'inherit' }}>
                        {bill.adjustmentsTotal !== 0 ? `₹${Math.abs(bill.adjustmentsTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>₹{bill.netBillAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>
                        {bill.allocated > 0 ? `₹${bill.allocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: bill.outstanding > 0.01 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        ₹{bill.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        {bill.isOverdue ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.75rem' }}>
                            {bill.daysOverdue}d overdue
                          </span>
                        ) : bill.dueDate ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Due {new Date(bill.dueDate).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`badge ${bill.status === 'SETTLED' ? 'badge-success' : bill.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'}`}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredBillWise.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        No bills matching the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredBillWise.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--color-surface)', borderTop: '2px solid var(--color-border)' }}>
                      <td colSpan={5} style={{ textAlign: 'right', padding: '0.75rem' }}>TOTALS:</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem' }}>₹{totalOsBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--color-danger)' }}>₹{totalOsReturns.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem' }}>₹{totalOsNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--color-success)' }}>₹{totalOsAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--color-danger)', fontSize: '1rem' }}>₹{totalOsPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: PARTY LEDGER STATEMENTS (KHATA)                   */}
      {/* ========================================================= */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {eligibleParties.map(party => {
            const ledger = buildPartyLedger(party);
            if (ledger.entries.length === 0 && ledger.opBal === 0 && selectedPartyId !== party.id) {
              return null; // Don't clutter "All Parties" view with inactive parties
            }

            const isReceivable = ledger.netClosing >= 0;

            return (
              <div key={party.id} className="premium-card" style={{ padding: '1.5rem', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                {/* Party Details Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Building2 size={20} color="var(--color-primary)" />
                      {party.name} 
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>({party.code})</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                      <span><strong>Role:</strong> {party.role}</span>
                      {party.gstin && <span><strong>GSTIN:</strong> {party.gstin}</span>}
                      {party.mobile && <span><strong>Phone:</strong> {party.mobile}</span>}
                      {party.billingAddress && <span><strong>City/State:</strong> {party.state || party.billingAddress}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Net Outstanding Balance
                    </p>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: isReceivable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      ₹{Math.abs(ledger.netClosing).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '0.35rem' }}>
                        {isReceivable ? '(Receivable)' : '(Payable)'}
                      </span>
                    </h3>
                    {ledger.opBal > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Opening: ₹{ledger.opBal.toLocaleString()} ({ledger.opType})
                      </span>
                    )}
                  </div>
                </div>

                {/* Ledger Transactions Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Voucher / Ref</th>
                        <th>Bill No</th>
                        <th>Particulars / Transaction</th>
                        <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                        <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                        <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Opening Balance Row */}
                      {ledger.opBal > 0 && (
                        <tr style={{ backgroundColor: 'var(--color-surface)', fontStyle: 'italic' }}>
                          <td>{startDate || '-'}</td>
                          <td>OP-BAL</td>
                          <td>-</td>
                          <td><strong>Opening Balance brought forward</strong></td>
                          <td style={{ textAlign: 'right' }}>{ledger.opType === 'RECEIVABLE' ? `₹${ledger.opBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                          <td style={{ textAlign: 'right' }}>{ledger.opType === 'PAYABLE' ? `₹${ledger.opBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{ledger.opBal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {ledger.opType === 'RECEIVABLE' ? 'Dr' : 'Cr'}</td>
                        </tr>
                      )}

                      {/* Chronological Transactions */}
                      {ledger.entries.map((entry, idx) => {
                        const isDr = entry.runningBalance >= 0;
                        return (
                          <tr key={idx}>
                            <td>{entry.date.toLocaleDateString()}</td>
                            <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{entry.ref}</span></td>
                            <td><strong style={{ color: 'var(--color-primary)' }}>{entry.billNo}</strong></td>
                            <td>{entry.particulars}</td>
                            <td style={{ textAlign: 'right', fontWeight: entry.debit ? 600 : 'normal' }}>
                              {entry.debit ? `₹${entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: entry.credit ? 600 : 'normal', color: entry.credit ? 'var(--color-success)' : 'inherit' }}>
                              {entry.credit ? `₹${entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: isDr ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              ₹{Math.abs(entry.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {isDr ? 'Dr' : 'Cr'}
                            </td>
                          </tr>
                        );
                      })}

                      {ledger.entries.length === 0 && ledger.opBal === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                            No transactions recorded for this party.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {ledger.entries.length > 0 && (
                      <tfoot>
                        <tr style={{ fontWeight: 700, backgroundColor: 'var(--color-surface)', borderTop: '2px solid var(--color-border)' }}>
                          <td colSpan={4} style={{ textAlign: 'right', padding: '0.75rem' }}>TOTALS:</td>
                          <td style={{ textAlign: 'right', padding: '0.75rem' }}>₹{ledger.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--color-success)' }}>₹{ledger.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'right', padding: '0.75rem', fontSize: '1rem', color: isReceivable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            ₹{Math.abs(ledger.netClosing).toLocaleString(undefined, { minimumFractionDigits: 2 })} {isReceivable ? 'Dr' : 'Cr'}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })}

          {eligibleParties.length === 0 && (
            <div className="premium-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No parties found matching the selected filter.
            </div>
          )}
        </div>
      )}

      {/* PRINT-ONLY SIGNATURE SECTION */}
      <div className="print-only" style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #999', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <div>
          <p style={{ fontSize: '8pt', color: '#555', margin: 0 }}>
            * This statement is computer generated and reflects all trade bills, returns, deductions &amp; payments recorded in the agency accounting system.
          </p>
        </div>
        <div style={{ textAlign: 'center', minWidth: '220px' }}>
          <div style={{ height: '50px' }}></div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
            <strong style={{ fontSize: '9pt' }}>For AGENCY ACCOUNTING</strong><br />
            <span style={{ fontSize: '8pt', color: '#555' }}>Authorized Signatory</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
