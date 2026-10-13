const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🌱 SEEDING TEXTILE AGENCY ACCOUNTING DATA (ALL ANGLES)');
  console.log('====================================================\n');

  // 1. Clean existing data in reverse order of foreign keys
  console.log('🧹 Cleaning existing transaction and party data...');
  await prisma.settlementAllocation.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.adjustmentNote.deleteMany({});
  await prisma.tradeInvoiceLine.deleteMany({});
  await prisma.commissionRecord.deleteMany({});
  await prisma.tradeInvoice.deleteMany({});
  await prisma.agentVouchers.deleteMany({});
  await prisma.party.deleteMany({});
  // We keep or upsert the admin user
  console.log('✅ Tables cleaned successfully.\n');

  // 2. Admin User
  console.log('👤 Ensuring Admin User exists...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  console.log(`✅ Admin ready: username: "admin", password: "admin123"\n`);

  // 3. Parties (Suppliers, Buyers, and Both)
  console.log('🏢 Creating Parties (Suppliers, Buyers & Both)...');

  // --- SUPPLIERS (Mills / Weavers / Processors) ---
  const supplierVardhman = await prisma.party.create({
    data: {
      code: 'P-1001',
      name: 'Vardhman Polytex Mills Ltd',
      role: 'SUPPLIER',
      contactPerson: 'Rameshwar Sharma',
      mobile: '9825012345',
      email: 'sales@vardhmantex.com',
      billingAddress: 'Industrial Area A, Ludhiana, Punjab',
      state: 'Punjab',
      stateCode: '03',
      gstin: '03AAACV1234D1Z5',
      pan: 'AAACV1234D',
      creditPeriodDays: 30,
      defaultPaymentTerms: '30 Days Net from LR Date',
      openingBalanceAmount: 45000,
      openingBalanceType: 'PAYABLE',
      bankDetails: 'HDFC Bank - A/c 50200012345678, IFSC: HDFC0000123',
      commissionRate: 1.5,
      notes: 'Leading supplier of grey cotton and combric fabric. Very punctual on dispatch.'
    }
  });

  const supplierArvind = await prisma.party.create({
    data: {
      code: 'P-1002',
      name: 'Arvind Weaves & Bottomwear Ltd',
      role: 'SUPPLIER',
      contactPerson: 'Ketan Patel',
      mobile: '9879054321',
      email: 'ketan@arvindweaves.in',
      billingAddress: 'Naroda Road, Ahmedabad, Gujarat',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24AABCA1234E1Z1',
      pan: 'AABCA1234E',
      creditPeriodDays: 45,
      defaultPaymentTerms: '45 Days Net via RTGS',
      openingBalanceAmount: 120000,
      openingBalanceType: 'PAYABLE',
      bankDetails: 'State Bank of India - A/c 30129845671, IFSC: SBIN0001420',
      commissionRate: 2.0,
      notes: 'Denim and twill suiting specialist. Higher commission agreed on bottomwear.'
    }
  });

  const supplierSuratRayon = await prisma.party.create({
    data: {
      code: 'P-1003',
      name: 'Surat Rayon & Silk Processing Mill',
      role: 'SUPPLIER',
      contactPerson: 'Sanjay Chordia',
      mobile: '9824198765',
      email: 'sanjay@suratrayon.com',
      billingAddress: 'Ring Road Textile Market, Surat, Gujarat',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24AAACS5678F1Z9',
      pan: 'AAACS5678F',
      creditPeriodDays: 21,
      defaultPaymentTerms: '21 Days LC / RTGS',
      openingBalanceAmount: 0,
      openingBalanceType: 'PAYABLE',
      bankDetails: 'ICICI Bank - A/c 002405001290, IFSC: ICIC0000024',
      commissionRate: 1.0,
      notes: 'Viscose, Liva Rayon prints, Georgette & Modal fabrics.'
    }
  });

  const supplierBhilwara = await prisma.party.create({
    data: {
      code: 'P-1004',
      name: 'Bhilwara Suiting & Synthetics',
      role: 'SUPPLIER',
      contactPerson: 'Mahendra Lodha',
      mobile: '9414012987',
      email: 'orders@bhilwarasuiting.in',
      billingAddress: 'RIICO Growth Centre, Bhilwara, Rajasthan',
      state: 'Rajasthan',
      stateCode: '08',
      gstin: '08AAACB9876G1Z3',
      pan: 'AAACB9876G',
      creditPeriodDays: 60,
      defaultPaymentTerms: '60 Days Credit with Post-dated Cheques',
      openingBalanceAmount: 85000,
      openingBalanceType: 'PAYABLE',
      bankDetails: 'Bank of Baroda - A/c 18900200001452, IFSC: BARB0BHILWA',
      commissionRate: 2.0,
      notes: 'Uniform fabrics and poly-viscose suitings.'
    }
  });

  // --- BUYERS (Wholesalers / Retailers / Garment Factories) ---
  const buyerMetro = await prisma.party.create({
    data: {
      code: 'P-1005',
      name: 'Metro Garments & Apparel Co',
      role: 'BUYER',
      contactPerson: 'Anand Agrawal',
      mobile: '9820011223',
      email: 'anand@metrogarments.com',
      billingAddress: 'Senapati Bapat Marg, Dadar West, Mumbai, Maharashtra',
      state: 'Maharashtra',
      stateCode: '27',
      gstin: '27AABCM2222B1Z4',
      pan: 'AABCM2222B',
      creditPeriodDays: 30,
      defaultPaymentTerms: '30 Days Net',
      openingBalanceAmount: 150000,
      openingBalanceType: 'RECEIVABLE',
      bankDetails: 'Axis Bank - Dadar Branch',
      commissionRate: 0,
      notes: 'Major garment exporter & domestic brand manufacturer. Large volume buyer.'
    }
  });

  const buyerRoyalEthnic = await prisma.party.create({
    data: {
      code: 'P-1006',
      name: 'Royal Ethnic Sarees & Suit House',
      role: 'BUYER',
      contactPerson: 'Vipul Jain',
      mobile: '9811099887',
      email: 'vipul@royalethnic.in',
      billingAddress: 'Nai Sarak, Chandni Chowk, Delhi',
      state: 'Delhi',
      stateCode: '07',
      gstin: '07AAACR1111A1Z2',
      pan: 'AAACR1111A',
      creditPeriodDays: 45,
      defaultPaymentTerms: '45 Days Net',
      openingBalanceAmount: 65000,
      openingBalanceType: 'RECEIVABLE',
      bankDetails: 'Kotak Mahindra Bank - Chandni Chowk',
      commissionRate: 0,
      notes: 'Wholesale dealer of women ethnic wear and printed rayon/cotton.'
    }
  });

  const buyerJaipurHub = await prisma.party.create({
    data: {
      code: 'P-1007',
      name: 'Jaipur Fashion Hub & Kurtis',
      role: 'BUYER',
      contactPerson: 'Pooja Khandelwal',
      mobile: '9829033445',
      email: 'pooja@jaipurfashionhub.com',
      billingAddress: 'Johari Bazaar, Jaipur, Rajasthan',
      state: 'Rajasthan',
      stateCode: '08',
      gstin: '08AAACJ3333C1Z6',
      pan: 'AAACJ3333C',
      creditPeriodDays: 30,
      defaultPaymentTerms: '30 Days',
      openingBalanceAmount: 0,
      openingBalanceType: 'RECEIVABLE',
      bankDetails: 'Punjab National Bank - Jaipur',
      commissionRate: 0,
      notes: 'Cotton printed fabrics and sanganeri prints consumer.'
    }
  });

  const buyerClassicCloth = await prisma.party.create({
    data: {
      code: 'P-1008',
      name: 'Classic Cloth Emporium',
      role: 'BUYER',
      contactPerson: 'Murali Krishna',
      mobile: '9845077889',
      email: 'murali@classiccloth.co.in',
      billingAddress: 'Commercial Street, Bangalore, Karnataka',
      state: 'Karnataka',
      stateCode: '29',
      gstin: '29AAACC5555E1Z0',
      pan: 'AAACC5555E',
      creditPeriodDays: 30,
      defaultPaymentTerms: 'Immediate upon delivery',
      openingBalanceAmount: 0,
      openingBalanceType: 'RECEIVABLE',
      bankDetails: 'Canara Bank - Bangalore',
      commissionRate: 0,
      notes: 'Shirting and suiting retail chain across Karnataka.'
    }
  });

  // --- BOTH (Trader / Dual Role) ---
  const partyBalajiSyntex = await prisma.party.create({
    data: {
      code: 'P-1009',
      name: 'Balaji Syntex & Trading Corp',
      role: 'BOTH',
      contactPerson: 'Murugan Chettiar',
      mobile: '9443088990',
      email: 'murugan@balajisyntex.com',
      billingAddress: 'Brough Road, Erode, Tamil Nadu',
      state: 'Tamil Nadu',
      stateCode: '33',
      gstin: '33AAACB7777G1Z4',
      pan: 'AAACB7777G',
      creditPeriodDays: 30,
      defaultPaymentTerms: '30 Days Credit',
      openingBalanceAmount: 20000,
      openingBalanceType: 'RECEIVABLE',
      bankDetails: 'Indian Bank - Erode Main Branch',
      commissionRate: 1.0,
      notes: 'Acts as grey fabric supplier as well as finished cloth buyer.'
    }
  });

  console.log('✅ 9 diverse parties created (Suppliers, Buyers, and Both).\n');

  // Helpers for realistic date generation
  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  // 4. Trade Invoices (10 Realistic Bills across 3 months)
  console.log('📄 Creating Trade Invoices with line items and taxes...');

  // Invoice 1: Fully Settled invoice (60 days ago)
  const inv1 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1001',
      supplierBillNumber: 'VPT-501',
      billDate: daysAgo(60),
      dueDate: daysAgo(30),
      supplierId: supplierVardhman.id,
      buyerId: buyerMetro.id,
      status: 'SETTLED',
      remarks: 'Cotton cambric 60x60 first quality dispatch via VRL Logistics',
      lines: {
        create: [
          {
            itemDescription: 'Cotton Cambric 60x60 White Finish',
            fabricCategory: 'Cotton',
            quantityMeters: 4000,
            ratePerMeter: 65,
            discount: 5000,
            lineTotal: 255000, // (4000 * 65) - 5000
            gstRate: 5,
            taxAmount: 12750, // 5% of 255000
            otherCharges: 2500 // Packing & Freight
          }
        ]
      }
    }
  }); // Total value: 255000 + 12750 = 267750 (+ otherCharges)

  // Invoice 2: Partially Settled invoice with Return (45 days ago)
  const inv2 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1002',
      supplierBillNumber: 'ARV-890',
      billDate: daysAgo(45),
      dueDate: daysAgo(15),
      supplierId: supplierArvind.id,
      buyerId: buyerMetro.id,
      status: 'PARTIALLY_SETTLED',
      remarks: 'Indigo Denim 11oz Twill and Cotton Drill',
      lines: {
        create: [
          {
            itemDescription: 'Indigo Knit Denim 11oz Twill',
            fabricCategory: 'Denim',
            quantityMeters: 2500,
            ratePerMeter: 160,
            discount: 0,
            lineTotal: 400000,
            gstRate: 5,
            taxAmount: 20000,
            otherCharges: 0
          },
          {
            itemDescription: 'Cotton Bottomweight Drill 3/1',
            fabricCategory: 'Cotton',
            quantityMeters: 1000,
            ratePerMeter: 95,
            discount: 0,
            lineTotal: 95000,
            gstRate: 5,
            taxAmount: 4750,
            otherCharges: 1500
          }
        ]
      }
    }
  }); // Total: (400000 + 20000) + (95000 + 4750) = 519750

  // Invoice 3: Overdue Unsettled Invoice (40 days ago, due 10 days ago)
  const inv3 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1003',
      supplierBillNumber: 'SR-7712',
      billDate: daysAgo(40),
      dueDate: daysAgo(10), // Overdue!
      supplierId: supplierSuratRayon.id,
      buyerId: buyerRoyalEthnic.id,
      status: 'OVERDUE',
      remarks: 'Viscose Rayon 14kg Mill Print & Foil Work',
      lines: {
        create: [
          {
            itemDescription: 'Viscose Rayon 14kg Foil Printed Fabric',
            fabricCategory: 'Rayon',
            quantityMeters: 3200,
            ratePerMeter: 92,
            discount: 4400,
            lineTotal: 290000,
            gstRate: 5,
            taxAmount: 14500,
            otherCharges: 1200
          }
        ]
      }
    }
  }); // Total: 304500

  // Invoice 4: Suiting bill with Overdue Status (50 days ago)
  const inv4 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1004',
      supplierBillNumber: 'BS-1029',
      billDate: daysAgo(50),
      dueDate: daysAgo(5), // Overdue!
      supplierId: supplierBhilwara.id,
      buyerId: buyerClassicCloth.id,
      status: 'OVERDUE',
      remarks: 'Poly-Viscose formal suiting cloth rolls',
      lines: {
        create: [
          {
            itemDescription: 'PV Formal Suiting 2/30 Count Blend',
            fabricCategory: 'Suiting',
            quantityMeters: 1800,
            ratePerMeter: 175,
            discount: 5000,
            lineTotal: 310000,
            gstRate: 5,
            taxAmount: 15500,
            otherCharges: 0
          }
        ]
      }
    }
  }); // Total: 325500

  // Invoice 5: Settled Bill for Jaipur Fashion Hub (30 days ago)
  const inv5 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1005',
      supplierBillNumber: 'VPT-620',
      billDate: daysAgo(30),
      dueDate: daysAgo(5),
      supplierId: supplierVardhman.id,
      buyerId: buyerJaipurHub.id,
      status: 'SETTLED',
      remarks: 'Cambric 60x60 grey fabric for printing',
      lines: {
        create: [
          {
            itemDescription: 'Cotton Cambric Grey 60x60 52 inch',
            fabricCategory: 'Cotton',
            quantityMeters: 3000,
            ratePerMeter: 58,
            discount: 4000,
            lineTotal: 170000,
            gstRate: 5,
            taxAmount: 8500,
            otherCharges: 0
          }
        ]
      }
    }
  }); // Total: 178500

  // Invoice 6: Active / Posted Bill (15 days ago, due in 15 days)
  const inv6 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1006',
      supplierBillNumber: 'SR-8010',
      billDate: daysAgo(15),
      dueDate: daysAgo(-15), // Future due date!
      supplierId: supplierSuratRayon.id,
      buyerId: buyerRoyalEthnic.id,
      status: 'POSTED',
      remarks: 'Modal Silk Jacquard festive fabric',
      lines: {
        create: [
          {
            itemDescription: 'Pure Modal Silk Jacquard Weave',
            fabricCategory: 'Silk Blend',
            quantityMeters: 1200,
            ratePerMeter: 210,
            discount: 2000,
            lineTotal: 250000,
            gstRate: 5,
            taxAmount: 12500,
            otherCharges: 1000
          }
        ]
      }
    }
  }); // Total: 262500

  // Invoice 7: Balaji Syntex dual-role purchase (12 days ago)
  const inv7 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1007',
      supplierBillNumber: 'BAL-304',
      billDate: daysAgo(12),
      dueDate: daysAgo(-18),
      supplierId: partyBalajiSyntex.id,
      buyerId: buyerMetro.id,
      status: 'POSTED',
      remarks: 'Grey Cotton Sheeting 40x40 direct mill dispatch',
      lines: {
        create: [
          {
            itemDescription: 'Grey Cotton Sheeting 40x40 63 inch',
            fabricCategory: 'Grey Cotton',
            quantityMeters: 6000,
            ratePerMeter: 46,
            discount: 6000,
            lineTotal: 270000,
            gstRate: 5,
            taxAmount: 13500,
            otherCharges: 3000
          }
        ]
      }
    }
  }); // Total: 283500

  // Invoice 8: Recent invoice (5 days ago)
  const inv8 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1008',
      supplierBillNumber: 'ARV-945',
      billDate: daysAgo(5),
      dueDate: daysAgo(-40),
      supplierId: supplierArvind.id,
      buyerId: buyerClassicCloth.id,
      status: 'POSTED',
      remarks: 'Linen Slub shirting rolls in assorted shades',
      lines: {
        create: [
          {
            itemDescription: 'Linen Slub Shirting 60 Lea',
            fabricCategory: 'Linen',
            quantityMeters: 1500,
            ratePerMeter: 145,
            discount: 2500,
            lineTotal: 215000,
            gstRate: 5,
            taxAmount: 10750,
            otherCharges: 800
          }
        ]
      }
    }
  }); // Total: 225750

  // Invoice 9: Bulk Quick Invoice (3 days ago - single line created via quick entry)
  const inv9 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1009',
      supplierBillNumber: 'BS-1088',
      billDate: daysAgo(3),
      dueDate: daysAgo(-27),
      supplierId: supplierBhilwara.id,
      buyerId: buyerMetro.id,
      status: 'POSTED',
      remarks: 'Quick Bulk Entry - Uniform Gabardine',
      lines: {
        create: [
          {
            itemDescription: 'Uniform Gabardine Heavy Twill',
            fabricCategory: 'Uniform',
            quantityMeters: 1,
            ratePerMeter: 185000,
            discount: 0,
            lineTotal: 185000,
            gstRate: 0,
            taxAmount: 0,
            otherCharges: 0
          }
        ]
      }
    }
  }); // Total: 185000

  // Invoice 10: Today's fresh bill
  const inv10 = await prisma.tradeInvoice.create({
    data: {
      voucherNumber: 'TRD-1010',
      supplierBillNumber: 'VPT-701',
      billDate: daysAgo(0),
      dueDate: daysAgo(-30),
      supplierId: supplierVardhman.id,
      buyerId: buyerRoyalEthnic.id,
      status: 'DRAFT',
      remarks: 'Fresh order placed - awaiting delivery confirmation',
      lines: {
        create: [
          {
            itemDescription: 'Mulmul Cotton 100s fine quality',
            fabricCategory: 'Cotton',
            quantityMeters: 2000,
            ratePerMeter: 82,
            discount: 4000,
            lineTotal: 160000,
            gstRate: 5,
            taxAmount: 8000,
            otherCharges: 0
          }
        ]
      }
    }
  });

  console.log('✅ 10 Trade Invoices created spanning past 60 days with diverse statuses.\n');

  // 5. Sales Returns & Deductions (Adjustment Notes)
  console.log('🔄 Creating Sales Returns, Debit Notes, and Credit Deductions...');

  // Note 1: Sales Return on inv2 (Denim print defect)
  await prisma.adjustmentNote.create({
    data: {
      noteNumber: 'NOT-1001',
      noteType: 'SALES_RETURN',
      noteDate: daysAgo(35),
      supplierId: supplierArvind.id,
      buyerId: buyerMetro.id,
      tradeInvoiceId: inv2.id,
      itemDescription: 'Defective shade variation in 250m denim roll',
      adjustedMeters: 250,
      rate: 160,
      taxableValue: 40000,
      gstDetails: 'GST 5% reversed',
      totalAdjustmentAmount: 42000, // 40000 + 5%
      adjustmentDirection: 'DECREASE',
      reason: '250 meters rejected due to listing defect / shade band',
      remarks: 'Returned goods approved by mill agent'
    }
  });

  // Note 2: Debit Note (Rate difference deduction on inv3)
  await prisma.adjustmentNote.create({
    data: {
      noteNumber: 'NOT-1002',
      noteType: 'DEBIT_NOTE',
      noteDate: daysAgo(25),
      supplierId: supplierSuratRayon.id,
      buyerId: buyerRoyalEthnic.id,
      tradeInvoiceId: inv3.id,
      itemDescription: 'Agreed rate difference ₹92 billed vs ₹88 agreed',
      adjustedMeters: 3200,
      rate: 4,
      taxableValue: 12800,
      gstDetails: 'Nil',
      totalAdjustmentAmount: 12800,
      adjustmentDirection: 'DECREASE',
      reason: 'Rate concession agreed on bulk confirmation message',
      remarks: 'Rate difference debit note debited to supplier'
    }
  });

  // Note 3: Credit Note (Turnover Discount / Scheme Allowance on inv1)
  await prisma.adjustmentNote.create({
    data: {
      noteNumber: 'NOT-1003',
      noteType: 'CREDIT_NOTE',
      noteDate: daysAgo(45),
      supplierId: supplierVardhman.id,
      buyerId: buyerMetro.id,
      tradeInvoiceId: inv1.id,
      itemDescription: 'Prompt payment incentive scheme 2%',
      adjustedMeters: null,
      rate: null,
      taxableValue: 5000,
      gstDetails: 'Nil',
      totalAdjustmentAmount: 5000,
      adjustmentDirection: 'DECREASE',
      reason: 'Turnover discount credit note for prompt clearance',
      remarks: 'Approved by Vardhman marketing manager'
    }
  });

  // Note 4: Standalone Debit Note (Shortage in bale count)
  await prisma.adjustmentNote.create({
    data: {
      noteNumber: 'NOT-1004',
      noteType: 'DEBIT_NOTE',
      noteDate: daysAgo(10),
      supplierId: supplierBhilwara.id,
      buyerId: buyerClassicCloth.id,
      tradeInvoiceId: inv4.id,
      itemDescription: 'Shortage of 65 meters measured at warehouse',
      adjustedMeters: 65,
      rate: 175,
      taxableValue: 11375,
      gstDetails: 'Nil',
      totalAdjustmentAmount: 11375,
      adjustmentDirection: 'DECREASE',
      reason: 'Length shortage found during fabric inspection',
      remarks: 'Debit note sent to mill'
    }
  });

  console.log('✅ 4 Sales Returns & Deductions created.\n');

  // 6. Payments & Settlements (with Invoice Allocations)
  console.log('💳 Creating Payments & Settlements with bill allocations...');

  // Settlement 1: Full Payment of inv1 (Metro Garments paid to Vardhman)
  // Inv1 was ~267750, less 5000 credit note = 262750
  const sett1 = await prisma.settlement.create({
    data: {
      referenceNumber: 'SETT-1001',
      settlementDate: daysAgo(30),
      payerId: buyerMetro.id,
      payeeId: supplierVardhman.id,
      amount: 262750,
      paymentMode: 'Bank Transfer (RTGS)',
      bankReference: 'HDFCR2026101300987',
      agentHandledMoney: false,
      unallocatedAmount: 0,
      remarks: 'Full settlement of bill VPT-501 minus scheme discount',
      allocations: {
        create: [
          {
            tradeInvoiceId: inv1.id,
            allocatedAmount: 262750
          }
        ]
      }
    }
  });

  // Settlement 2: Partial Payment of inv2 (Metro Garments paid Arvind)
  // Inv2 was 519750, partial payment of 300000
  const sett2 = await prisma.settlement.create({
    data: {
      referenceNumber: 'SETT-1002',
      settlementDate: daysAgo(20),
      payerId: buyerMetro.id,
      payeeId: supplierArvind.id,
      amount: 300000,
      paymentMode: 'Bank Transfer (NEFT)',
      bankReference: 'AXISN2026092044551',
      agentHandledMoney: false,
      unallocatedAmount: 0,
      remarks: 'Part payment against bill ARV-890',
      allocations: {
        create: [
          {
            tradeInvoiceId: inv2.id,
            allocatedAmount: 300000
          }
        ]
      }
    }
  });

  // Settlement 3: Full Payment of inv5 (Jaipur Hub paid Vardhman)
  const sett3 = await prisma.settlement.create({
    data: {
      referenceNumber: 'SETT-1003',
      settlementDate: daysAgo(8),
      payerId: buyerJaipurHub.id,
      payeeId: supplierVardhman.id,
      amount: 178500,
      paymentMode: 'Bank Transfer (IMPS)',
      bankReference: 'IMPS409823177890',
      agentHandledMoney: false,
      unallocatedAmount: 0,
      remarks: 'Clearance of bill VPT-620 in full',
      allocations: {
        create: [
          {
            tradeInvoiceId: inv5.id,
            allocatedAmount: 178500
          }
        ]
      }
    }
  });

  // Settlement 4: Cash Payment handled directly by Agent! (Royal Ethnic to Surat Rayon)
  const sett4 = await prisma.settlement.create({
    data: {
      referenceNumber: 'SETT-1004',
      settlementDate: daysAgo(5),
      payerId: buyerRoyalEthnic.id,
      payeeId: supplierSuratRayon.id,
      amount: 50000,
      paymentMode: 'Cash',
      bankReference: 'CASH-REC-DELHI',
      agentHandledMoney: true, // Track in agent cashbook!
      unallocatedAmount: 0,
      remarks: 'Agent collected cash on market visit against Bill SR-7712',
      allocations: {
        create: [
          {
            tradeInvoiceId: inv3.id,
            allocatedAmount: 50000
          }
        ]
      }
    }
  });

  // Settlement 5: Advance Payment with Unallocated Balance!
  const sett5 = await prisma.settlement.create({
    data: {
      referenceNumber: 'SETT-1005',
      settlementDate: daysAgo(2),
      payerId: buyerClassicCloth.id,
      payeeId: supplierBhilwara.id,
      amount: 100000,
      paymentMode: 'Cheque',
      bankReference: 'CHQ-778819',
      agentHandledMoney: false,
      unallocatedAmount: 20000, // 80000 allocated, 20000 advance
      remarks: 'Cheque received. ₹80k allocated against BS-1029, ₹20k advance.',
      allocations: {
        create: [
          {
            tradeInvoiceId: inv4.id,
            allocatedAmount: 80000
          }
        ]
      }
    }
  });

  console.log('✅ 5 Payments & Settlements created with exact allocations and unallocated amounts.\n');

  // 7. Agent Cashbook Vouchers (AgentVouchers)
  console.log('💼 Creating Agent Cashbook Vouchers (Receipts, Expenses & Transfers)...');

  await prisma.agentVouchers.create({
    data: {
      voucherNumber: 'VCH-1001',
      voucherType: 'RECEIPT',
      voucherDate: daysAgo(28),
      partyId: supplierVardhman.id,
      amount: 4016, // 1.5% commission on inv1
      accountName: 'Commission Income',
      paymentMode: 'Bank Transfer',
      referenceNumber: 'CMS-VPT-1001',
      purpose: 'Commission received for bill VPT-501',
      remarks: 'Direct NEFT to agent business account'
    }
  });

  await prisma.agentVouchers.create({
    data: {
      voucherNumber: 'VCH-1002',
      voucherType: 'RECEIPT',
      voucherDate: daysAgo(5),
      partyId: buyerRoyalEthnic.id,
      amount: 50000,
      accountName: 'Trade Cash In-Hand',
      paymentMode: 'Cash',
      referenceNumber: 'REC-CSH-091',
      purpose: 'Trade cash collected from Royal Ethnic on behalf of Surat Rayon',
      remarks: 'To be deposited into bank / transferred to mill'
    }
  });

  await prisma.agentVouchers.create({
    data: {
      voucherNumber: 'VCH-1003',
      voucherType: 'PAYMENT',
      voucherDate: daysAgo(18),
      partyId: supplierArvind.id,
      amount: 3500,
      accountName: 'Travel & Mill Inspection Expense',
      paymentMode: 'UPI',
      referenceNumber: 'UPI409923881',
      purpose: 'Agent travel to Ahmedabad mill for fabric quality inspection',
      remarks: 'Train ticket & local cab expense'
    }
  });

  await prisma.agentVouchers.create({
    data: {
      voucherNumber: 'VCH-1004',
      voucherType: 'PAYMENT',
      voucherDate: daysAgo(12),
      partyId: buyerMetro.id,
      amount: 850,
      accountName: 'Courier & Sample Swatch Dispatch',
      paymentMode: 'Cash',
      referenceNumber: 'BLUEDART-5512',
      purpose: 'Courier charges for 15 fabric sample cuttings sent to Metro Garments',
      remarks: 'Express delivery swatch card'
    }
  });

  console.log('✅ 4 Agent Cashbook Vouchers created.\n');

  // 8. Auto-Commission Records
  console.log('💰 Creating Commission Records for agency earnings...');

  await prisma.commissionRecord.create({
    data: {
      referenceNumber: 'COM-1001',
      partyId: supplierVardhman.id,
      tradeInvoiceId: inv1.id,
      basis: 'PERCENTAGE',
      rate: 1.5,
      amount: 4016.25,
      status: 'COLLECTED',
      remarks: 'Commission for TRD-1001 collected in full'
    }
  });

  await prisma.commissionRecord.create({
    data: {
      referenceNumber: 'COM-1002',
      partyId: supplierArvind.id,
      tradeInvoiceId: inv2.id,
      basis: 'PERCENTAGE',
      rate: 2.0,
      amount: 10395.0,
      status: 'BILLED',
      remarks: 'Commission bill raised to Arvind for denim dispatch'
    }
  });

  await prisma.commissionRecord.create({
    data: {
      referenceNumber: 'COM-1003',
      partyId: supplierSuratRayon.id,
      tradeInvoiceId: inv3.id,
      basis: 'PERCENTAGE',
      rate: 1.0,
      amount: 3045.0,
      status: 'EARNED',
      remarks: 'Commission earned on rayon print dispatch - pending collection'
    }
  });

  await prisma.commissionRecord.create({
    data: {
      referenceNumber: 'COM-1004',
      partyId: supplierBhilwara.id,
      tradeInvoiceId: inv4.id,
      basis: 'PERCENTAGE',
      rate: 2.0,
      amount: 6510.0,
      status: 'EARNED',
      remarks: 'Commission on PV suiting dispatch'
    }
  });

  console.log('✅ 4 Commission Records created.\n');

  console.log('====================================================');
  console.log('🎉 ALL DUMMY DATA SEEDED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('📊 Summary:');
  console.log('  • Admin User: admin / admin123');
  console.log('  • Parties: 9 (4 Suppliers, 4 Buyers, 1 Both)');
  console.log('  • Trade Invoices: 10 (Settled, Partial, Overdue, Posted, Draft)');
  console.log('  • Sales Returns & Deductions: 4 (Sales Return, Debit Notes, Credit Notes)');
  console.log('  • Payments & Settlements: 5 (RTGS, NEFT, Cheque, Cash, Advance)');
  console.log('  • Agent Cashbook Vouchers: 4 (Receipts, Travel, Samples, Cash)');
  console.log('  • Commission Records: 4 (Earned, Billed, Collected)');
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
