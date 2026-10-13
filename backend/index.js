const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agency-super-secret-key';

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// === Auth API ===
app.post('/api/auth/setup', async (req, res) => {
  try {
    const adminExists = await prisma.user.findFirst();
    if (adminExists) return res.status(400).json({ error: 'System already configured' });
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword, role: 'ADMIN' } });
    res.json({ message: 'Admin created successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username, role: user.role });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

const authenticateToken = (req, res, next) => {
  if (req.path.startsWith('/auth')) return next(); // Already under /api
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.use('/api', authenticateToken);

// === Parties API ===
app.get('/api/parties', async (req, res) => {
  try {
    const parties = await prisma.party.findMany({ orderBy: { name: 'asc' } });
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/parties', async (req, res) => {
  try {
    const party = await prisma.party.create({ data: req.body });
    res.json(party);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Trade Invoices API ===
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.tradeInvoice.findMany({
      include: {
        supplier: true,
        buyer: true,
        lines: true,
        allocations: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { supplierId, buyerId, supplierBillNumber, billDate, dueDate, lines, amount, itemDescription } = req.body;
    
    // Auto-generate voucher number
    const count = await prisma.tradeInvoice.count();
    const voucherNumber = `TRD-${1000 + count + 1}`;

    const lineItems = (Array.isArray(lines) && lines.length > 0)
      ? lines.map(line => {
          const baseTotal = Number(line.quantityMeters) * Number(line.ratePerMeter);
          const discount = Number(line.discount) || 0;
          const lineTotal = baseTotal - discount;
          const gstRate = Number(line.gstRate) || 0;
          const taxAmount = lineTotal * (gstRate / 100);
          const otherCharges = Number(line.otherCharges) || 0;
          
          return {
            itemDescription: line.itemDescription || 'Cloth Material',
            quantityMeters: line.quantityMeters || 1,
            ratePerMeter: line.ratePerMeter || lineTotal,
            discount: discount,
            lineTotal: lineTotal,
            gstRate: gstRate,
            taxAmount: taxAmount,
            otherCharges: otherCharges
          };
        })
      : [{
          itemDescription: itemDescription || 'Cloth Goods',
          quantityMeters: 1,
          ratePerMeter: Number(amount) || 0,
          discount: 0,
          lineTotal: Number(amount) || 0,
          gstRate: 0,
          taxAmount: 0,
          otherCharges: 0
        }];

    const invoice = await prisma.tradeInvoice.create({
      data: {
        voucherNumber,
        supplierId,
        buyerId,
        supplierBillNumber: supplierBillNumber || null,
        billDate: new Date(billDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        lines: {
          create: lineItems
        }
      },
      include: { lines: true, supplier: true, buyer: true }
    });
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// === Bulk Invoices API ===
app.post('/api/invoices/bulk', async (req, res) => {
  try {
    const { invoices } = req.body;
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ error: 'No invoices provided' });
    }

    const allParties = await prisma.party.findMany();
    const partyMap = new Map();
    allParties.forEach(p => partyMap.set(p.name.trim().toLowerCase(), p));

    let count = await prisma.tradeInvoice.count();
    const createdList = [];

    for (const inv of invoices) {
      let supId = inv.supplierId;
      let buyId = inv.buyerId;

      // Match or auto-create supplier by name if name provided
      if (!supId && inv.supplierName && inv.supplierName.trim()) {
        const sName = inv.supplierName.trim();
        let sup = partyMap.get(sName.toLowerCase());
        if (!sup) {
          const partyCount = await prisma.party.count();
          sup = await prisma.party.create({
            data: {
              code: `P-${1000 + partyCount + 1}`,
              name: sName,
              role: 'SUPPLIER'
            }
          });
          partyMap.set(sName.toLowerCase(), sup);
        }
        supId = sup.id;
      }

      // Match or auto-create buyer by name if name provided
      if (!buyId && inv.buyerName && inv.buyerName.trim()) {
        const bName = inv.buyerName.trim();
        let buy = partyMap.get(bName.toLowerCase());
        if (!buy) {
          const partyCount = await prisma.party.count();
          buy = await prisma.party.create({
            data: {
              code: `P-${1000 + partyCount + 1}`,
              name: bName,
              role: 'BUYER'
            }
          });
          partyMap.set(bName.toLowerCase(), buy);
        }
        buyId = buy.id;
      }

      if (!supId || !buyId) continue;

      count += 1;
      const voucherNumber = `TRD-${1000 + count}`;
      const invAmount = Number(inv.amount) || 0;
      const bDate = inv.billDate ? new Date(inv.billDate) : new Date();
      const dDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const billNo = inv.supplierBillNumber ? String(inv.supplierBillNumber).trim() : null;

      const created = await prisma.tradeInvoice.create({
        data: {
          voucherNumber,
          supplierId: supId,
          buyerId: buyId,
          supplierBillNumber: billNo,
          billDate: bDate,
          dueDate: dDate,
          lines: {
            create: [{
              itemDescription: inv.itemDescription || 'Cloth Goods',
              quantityMeters: 1,
              ratePerMeter: invAmount,
              discount: 0,
              lineTotal: invAmount,
              gstRate: 0,
              taxAmount: 0,
              otherCharges: 0
            }]
          }
        },
        include: { lines: true, supplier: true, buyer: true }
      });

      createdList.push(created);
    }

    res.json({ success: true, count: createdList.length, invoices: createdList });
  } catch (error) {
    console.error('Bulk invoice creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === Settlements API ===
app.get('/api/settlements', async (req, res) => {
  try {
    const settlements = await prisma.settlement.findMany({
      include: { payer: true, payee: true, allocations: { include: { tradeInvoice: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settlements', async (req, res) => {
  try {
    const { payerId, payeeId, amount, paymentMode, bankReference, agentHandledMoney, remarks, allocations } = req.body;
    
    const count = await prisma.settlement.count();
    const referenceNumber = `SETT-${1000 + count + 1}`;
    
    // Calculate unallocated
    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const unallocatedAmount = Number(amount) - totalAllocated;

    const settlement = await prisma.$transaction(async (tx) => {
      // 1. Create settlement
      const newSettlement = await tx.settlement.create({
        data: {
          referenceNumber,
          settlementDate: new Date(),
          payerId,
          payeeId,
          amount,
          paymentMode,
          bankReference,
          agentHandledMoney: agentHandledMoney || false,
          unallocatedAmount,
          remarks,
          allocations: {
            create: allocations.map(a => ({
              tradeInvoiceId: a.tradeInvoiceId,
              allocatedAmount: Number(a.allocatedAmount)
            }))
          }
        },
        include: { allocations: true }
      });

      // 2. Update invoice statuses based on new allocations
      for (const alloc of allocations) {
        const inv = await tx.tradeInvoice.findUnique({
          where: { id: alloc.tradeInvoiceId },
          include: { lines: true, allocations: true }
        });

        if (inv) {
          const totalInvoiceValue = inv.lines.reduce((s, l) => s + Number(l.lineTotal) + Number(l.taxAmount), 0);
          const currentlyAllocated = inv.allocations.reduce((s, a) => s + Number(a.allocatedAmount), 0);
          
          let newStatus = inv.status;
          if (currentlyAllocated >= totalInvoiceValue) {
            newStatus = 'SETTLED';
          } else if (currentlyAllocated > 0) {
            newStatus = 'PARTIALLY_SETTLED';
          }
          
          if (newStatus !== inv.status) {
            await tx.tradeInvoice.update({
              where: { id: inv.id },
              data: { status: newStatus }
            });
          }
        }
      }

      return newSettlement;
    });

    res.json(settlement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// === Adjustment Notes API ===
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await prisma.adjustmentNote.findMany({
      include: { supplier: true, buyer: true, tradeInvoice: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { noteType, noteDate, supplierId, buyerId, tradeInvoiceId, itemDescription, adjustedMeters, rate, taxableValue, gstDetails, totalAdjustmentAmount, adjustmentDirection, reason, remarks } = req.body;
    
    const count = await prisma.adjustmentNote.count();
    const noteNumber = `ADJ-${1000 + count + 1}`;
    
    const note = await prisma.adjustmentNote.create({
      data: {
        noteNumber,
        noteType,
        noteDate: new Date(noteDate),
        supplierId,
        buyerId,
        tradeInvoiceId: tradeInvoiceId || null,
        itemDescription,
        adjustedMeters: adjustedMeters ? Number(adjustedMeters) : null,
        rate: rate ? Number(rate) : null,
        taxableValue: taxableValue ? Number(taxableValue) : null,
        gstDetails,
        totalAdjustmentAmount: Number(totalAdjustmentAmount),
        adjustmentDirection,
        reason,
        remarks
      },
      include: { tradeInvoice: true }
    });
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// === Dashboard Stats ===
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalParties = await prisma.party.count();
    const invoices = await prisma.tradeInvoice.findMany({
      include: { lines: true, allocations: true, adjustmentNotes: true },
    });
    
    let totalUnsettled = 0;
    let totalOverdue = 0;
    
    invoices.forEach(inv => {
      const totalAmount = inv.lines.reduce((sum, line) => sum + Number(line.lineTotal) + Number(line.taxAmount), 0);
      const allocated = inv.allocations.reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);
      
      let adjustmentsTotal = 0;
      inv.adjustmentNotes.forEach(n => {
        if (n.adjustmentDirection === 'INCREASE') adjustmentsTotal += Number(n.totalAdjustmentAmount);
        if (n.adjustmentDirection === 'DECREASE') adjustmentsTotal -= Number(n.totalAdjustmentAmount);
      });

      const remaining = (totalAmount + adjustmentsTotal) - allocated;
      
      totalUnsettled += remaining;
      
      if (inv.dueDate && new Date(inv.dueDate) < new Date() && remaining > 0) {
        totalOverdue += remaining;
      }
    });

    const recentInvoices = await prisma.tradeInvoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { supplier: true, buyer: true, lines: true }
    });

    // Also get sum of recent settlements for the metric
    const recentSettlements = await prisma.settlement.aggregate({
      _sum: { amount: true }
    });

    res.json({
      totalUnsettled,
      totalOverdue,
      activeParties: totalParties,
      recentSettlements: recentSettlements._sum.amount || 0,
      recentInvoices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Agent Vouchers API (Agent Cashbook) ===
app.get('/api/vouchers', async (req, res) => {
  try {
    const vouchers = await prisma.agentVouchers.findMany({
      include: { party: true },
      orderBy: { voucherDate: 'desc' }
    });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vouchers', async (req, res) => {
  try {
    const { voucherType, voucherDate, partyId, amount, accountName, paymentMode, referenceNumber, purpose, remarks } = req.body;
    
    const count = await prisma.agentVouchers.count({ where: { voucherType } });
    const prefix = voucherType === 'RECEIPT' ? 'RCPT' : voucherType === 'PAYMENT' ? 'PAY' : 'JNL';
    const voucherNumber = `${prefix}-${1000 + count + 1}`;
    
    const voucher = await prisma.agentVouchers.create({
      data: {
        voucherType,
        voucherNumber,
        voucherDate: new Date(voucherDate),
        partyId,
        amount: Number(amount),
        accountName,
        paymentMode,
        referenceNumber,
        purpose,
        remarks
      },
      include: { party: true }
    });
    res.json(voucher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// === Commission Register API ===
app.get('/api/commissions', async (req, res) => {
  try {
    const commissions = await prisma.commissionRecord.findMany({
      include: { party: true, tradeInvoice: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(commissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/commissions', async (req, res) => {
  try {
    const { partyId, tradeInvoiceId, basis, rate, amount, status, remarks } = req.body;
    
    const count = await prisma.commissionRecord.count();
    const referenceNumber = `COMM-${1000 + count + 1}`;
    
    const commission = await prisma.commissionRecord.create({
      data: {
        referenceNumber,
        partyId,
        tradeInvoiceId: tradeInvoiceId || null,
        basis,
        rate: rate ? Number(rate) : null,
        amount: Number(amount),
        status: status || 'EARNED',
        remarks
      },
      include: { party: true }
    });
    res.json(commission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// === Analytics & Aging API ===
app.get('/api/analytics', async (req, res) => {
  try {
    const invoices = await prisma.tradeInvoice.findMany({
      include: { lines: true, allocations: true, adjustmentNotes: true, buyer: true, supplier: true }
    });
    
    const aging = {
      notDue: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0
    };
    
    const buyerBalances = {};
    const supplierVolumes = {};
    const buyerVolumes = {};
    const now = new Date();
    
    invoices.forEach(inv => {
      const totalAmount = inv.lines.reduce((sum, line) => sum + Number(line.lineTotal) + Number(line.taxAmount), 0);
      const allocated = inv.allocations.reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);
      
      let adjustmentsTotal = 0;
      inv.adjustmentNotes.forEach(n => {
        if (n.adjustmentDirection === 'INCREASE') adjustmentsTotal += Number(n.totalAdjustmentAmount);
        if (n.adjustmentDirection === 'DECREASE') adjustmentsTotal -= Number(n.totalAdjustmentAmount);
      });

      const remaining = (totalAmount + adjustmentsTotal) - allocated;

      // Volume tracking
      if (!supplierVolumes[inv.supplierId]) {
         supplierVolumes[inv.supplierId] = { name: inv.supplier.name, totalTrade: 0, invoiceCount: 0 };
      }
      supplierVolumes[inv.supplierId].totalTrade += totalAmount;
      supplierVolumes[inv.supplierId].invoiceCount += 1;

      if (!buyerVolumes[inv.buyerId]) {
         buyerVolumes[inv.buyerId] = { name: inv.buyer.name, totalTrade: 0, invoiceCount: 0 };
      }
      buyerVolumes[inv.buyerId].totalTrade += totalAmount;
      buyerVolumes[inv.buyerId].invoiceCount += 1;
      
      if (remaining > 0) {
        // Record buyer balance
        if (!buyerBalances[inv.buyerId]) {
          buyerBalances[inv.buyerId] = { name: inv.buyer.name, balance: 0 };
        }
        buyerBalances[inv.buyerId].balance += remaining;

        // Aging
        if (!inv.dueDate || new Date(inv.dueDate) >= now) {
          aging.notDue += remaining;
        } else {
          const daysOverdue = Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
          if (daysOverdue <= 30) aging.days30 += remaining;
          else if (daysOverdue <= 60) aging.days60 += remaining;
          else if (daysOverdue <= 90) aging.days90 += remaining;
          else aging.over90 += remaining;
        }
      }
    });
    
    const topBuyers = Object.values(buyerBalances).sort((a, b) => b.balance - a.balance).slice(0, 5);
    const topSuppliersTrade = Object.values(supplierVolumes).sort((a, b) => b.totalTrade - a.totalTrade).slice(0, 5);
    const topBuyersTrade = Object.values(buyerVolumes).sort((a, b) => b.totalTrade - a.totalTrade).slice(0, 5);

    res.json({ aging, topBuyers, topSuppliersTrade, topBuyersTrade });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Generic Update API ===
app.put('/api/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    let result;
    if (entity === 'parties') {
      const data = { ...req.body };
      if (data.commissionRate) data.commissionRate = Number(data.commissionRate);
      if (data.openingBalanceAmount) data.openingBalanceAmount = Number(data.openingBalanceAmount);
      result = await prisma.party.update({ where: { id }, data });
    }
    else if (entity === 'invoices') result = await prisma.tradeInvoice.update({ where: { id }, data: { supplierBillNumber: req.body.supplierBillNumber, billDate: new Date(req.body.billDate) } });
    else return res.status(404).json({ error: 'Entity update not fully implemented or found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Generic Delete API ===
app.delete('/api/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    let result;
    if (entity === 'parties') result = await prisma.party.delete({ where: { id } });
    else if (entity === 'invoices') result = await prisma.tradeInvoice.delete({ where: { id } });
    else if (entity === 'notes') result = await prisma.adjustmentNote.delete({ where: { id } });
    else if (entity === 'settlements') result = await prisma.settlement.delete({ where: { id } });
    else if (entity === 'vouchers') result = await prisma.agentVouchers.delete({ where: { id } });
    else if (entity === 'commissions') result = await prisma.commissionRecord.delete({ where: { id } });
    else return res.status(404).json({ error: 'Entity not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
