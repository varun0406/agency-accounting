# Cloth Commission Agency Accounting System

## Business Requirements Document (BRD)

**Version:** 1.1\
**Status:** Finalized business model\
**Business model:** Agency model --- supplier invoices buyer directly\
**Commission:** Optional and managed separately\
**Primary focus:** Bill-wise outstanding, aging, settlements,
adjustments and party analytics

------------------------------------------------------------------------

## 1. Executive Summary

The system is designed for a cloth commission agent who connects
suppliers and buyers. The supplier invoices the buyer directly. The
agent records and monitors the underlying trade transactions, follows up
on outstanding amounts, records returns and debit/credit notes, and
tracks payments and receipts against individual invoices.

The system must not automatically treat the supplier's invoice to the
buyer as the agent's own purchase or sale. The trade ledger is a
tracking subledger for transactions between third parties. The agent's
own cash/bank movements, expenses, and commission income are recorded
separately.

The initial version is an accounting and transaction-tracking system,
not a physical inventory-management system.

### Primary objectives

-   Maintain supplier and buyer masters.
-   Record supplier invoices addressed to buyers.
-   Track invoice amounts, due dates, adjustments and settlements.
-   Support one payment allocated to multiple invoices and one invoice
    settled by multiple payments.
-   Provide accurate bill-wise and party-wise outstanding and aging
    reports.
-   Record sales returns, purchase returns, debit notes and credit notes
    without overwriting original invoices.
-   Provide buyer, supplier, settlement and transaction analytics.
-   Optionally record commission separately from the underlying trade
    invoices.
-   Preserve audit history and financial data integrity.

## 2. Business Model and Accounting Boundary

### 2.1 Agency model

1.  A supplier sells goods to a buyer and issues the invoice to that
    buyer.
2.  The agent records the invoice for tracking and follow-up.
3.  The buyer may pay the supplier directly or through an agreed
    settlement arrangement.
4.  The agent records the settlement against the relevant invoice(s).
5.  Returns and adjustment notes are linked to the original invoice
    where applicable.
6.  Commission, when applicable, is recorded in a separate commission
    register.

### 2.2 Critical accounting rule

The supplier-to-buyer invoice is **not automatically the agent's
purchase invoice or sales invoice**. It must be stored as a
**trade-tracking invoice**. The system must not include the full
supplier-buyer invoice value in the agent's own sales revenue,
purchases, GST liability, cash receipts or cash payments merely because
it is recorded in the application.

The system must distinguish between:

-   **Trade tracking:** Amounts the buyer owes the supplier, tracked for
    operational purposes.
-   **Agent's own accounting:** The agent's actual money received or
    paid, expenses, commission income and applicable taxes.

If the agent physically receives or pays money on behalf of another
party, that movement must be recorded as money held or transferred on
behalf of that party, using an appropriate clearing/agency account in
the agent's accounting books. It must not automatically be recognized as
revenue or expense.

The final statutory accounting and GST treatment should be configured to
reflect the actual contractual arrangement and reviewed by the
business's accountant.

## 3. Scope

### Included in Version 1

-   Supplier, buyer and party master records.
-   Trade invoice entry and invoice line items.
-   Returns, debit notes and credit notes.
-   Receipt and payment voucher records.
-   Bill-wise allocation and partial settlement.
-   Party ledger and bill-wise outstanding.
-   Aging reports and overdue follow-up.
-   Commission register (optional).
-   Dashboards, analytics, search and exports.
-   Audit trail, roles and financial-year settings.

### Not required for the initial version

-   Physical stock ledger or warehouse management.
-   Purchase-to-sales inventory movement.
-   Manufacturing, production or dispatch inventory workflows.
-   Automatic recognition of third-party invoices as the agent's own
    sales or purchases.
-   Automatic commission calculation on every transaction unless
    configured.

## 4. Party Master

Each business must have one unique party record. A party may be a
supplier, a buyer, or both.

### Fields

-   Party code (unique)
-   Legal/business name
-   Role: Supplier, Buyer, Both
-   Contact person
-   Mobile number and email
-   Billing address
-   State and state code
-   GSTIN
-   PAN, where required
-   Credit period in days
-   Default payment terms
-   Opening balance amount and classification
-   Bank details, if required
-   Notes/remarks
-   Active/inactive status

### Requirements

-   Prevent accidental duplicate party records.
-   Allow one party to operate in both supplier and buyer roles without
    duplicate identities.
-   Keep receivable/payable tracking directions distinct.
-   Store opening balances with clear as-of date, source and
    classification.
-   Opening balances must be reconcilable and must not be mistaken for
    newly issued invoices.

## 5. Trade Invoice Management

A trade invoice represents the supplier's invoice issued to the buyer.
It is recorded for monitoring the buyer's obligation to the supplier.

### Header fields

-   Internal record/voucher number
-   Transaction type: Supplier-to-buyer trade invoice
-   Supplier
-   Buyer
-   Supplier's bill number
-   Bill date
-   Due date
-   LR (Lorry Receipt) number
-   Credit terms
-   Invoice status: Draft, Posted, Partially Settled, Settled, Overdue,
    Cancelled
-   Remarks
-   Optional scanned bill/PDF attachment

### Invoice line fields

-   Item/fabric description
-   Optional fabric category, design, quality, shade or lot reference
-   Quantity in meters
-   Rate per meter
-   Line total
-   Discount, if applicable
-   GST rate and tax amount, where present on the source invoice
-   Other charge/deduction allocation, if required

### Invoice totals

The system must retain the values as printed on the source invoice and
show a transparent calculation breakdown.

Basic line calculation:

`Line Total = Meters × Rate`

A configurable invoice calculation can be represented as:

`Invoice Total = Taxable Value + GST + Other Charges − Other Deductions`

Taxable value and GST must reflect the source invoice and applicable tax
treatment. Discounts must not automatically reduce taxable value unless
the relevant tax rules and source document support that treatment.

### Invoice validation

-   Supplier, buyer, bill number and bill date are required.
-   At least one valid line item is required.
-   Warn about duplicate supplier bill numbers for the same supplier.
-   Preserve the original invoice after posting.
-   Corrections to posted records must use a controlled amendment,
    cancellation or adjustment process.
-   Due date may be calculated from credit terms but must be overridable
    by authorized users.
-   Support configurable numbering by financial year and record type.

## 6. Returns, Debit Notes and Credit Notes

Returns and notes must be separate records. They must not overwrite or
silently alter the original invoice.

### Supported records

1.  **Sales return:** Buyer returns goods previously supplied by the
    supplier.
2.  **Purchase return:** Goods are returned to the supplier by the
    buyer.
3.  **Debit note:** A documented adjustment whose effect depends on the
    issuer, recipient and reason.
4.  **Credit note:** A documented credit or reduction whose effect
    depends on the issuer, recipient and reason.

Because the agent is tracking a transaction between two other parties,
the system must record the issuer, recipient, supplier, buyer and
accounting direction for each note explicitly. It must not infer the
direction from the label alone.

### Fields

-   Internal note number
-   Note type
-   Note date
-   Supplier and buyer
-   Issuer and recipient
-   Original invoice reference, where applicable
-   Item description
-   Returned/adjusted meters, where relevant
-   Rate and taxable value
-   GST details, where relevant
-   Total adjustment amount
-   Adjustment direction
-   Reason and remarks
-   Attachment/reference number
-   Approval and audit history

### Rules

-   One invoice can have multiple returns and adjustment notes.
-   A note may be linked to an invoice or recorded as a standalone party
    adjustment where justified.
-   The system must support partial returns.
-   Notes must adjust the correct party's trade balance based on their
    actual direction.
-   Notes must retain a complete link to the original invoice and never
    erase its original values.
-   Any statutory tax-credit-note or debit-note treatment must be
    handled according to applicable tax rules.

## 7. Receipt and Payment Vouchers

Vouchers record settlement activity. The system must distinguish between
a **settlement recorded for trade tracking** and an **actual cash/bank
movement handled by the agent**.

### 7.1 Settlement record

Use this to record that a buyer has paid a supplier invoice or that a
supplier-buyer balance has otherwise been settled, including when the
agent did not handle the money.

Fields:

-   Settlement reference number
-   Settlement date
-   Supplier
-   Buyer
-   Amount
-   Payment mode, if known
-   Bank/UTR/cheque reference, if available
-   Payer and payee
-   Whether the agent handled the money: Yes/No
-   Related invoices and allocations
-   Unallocated amount
-   Remarks
-   Supporting document

### 7.2 Agent receipt voucher

Use this only when the agent actually receives money.

Fields:

-   Receipt voucher number and date
-   Payer
-   Amount received
-   Cash/bank account
-   Mode: Cash, bank transfer, cheque, UPI or other
-   UTR/cheque/reference number
-   Purpose and related party
-   Related settlement/invoices, if applicable
-   Unallocated amount
-   Remarks

### 7.3 Agent payment voucher

Use this only when the agent actually pays money.

Fields:

-   Payment voucher number and date
-   Payee
-   Amount paid
-   Cash/bank account
-   Mode and transaction reference
-   Purpose and related party
-   Related settlement/invoices, if applicable
-   Remarks

### 7.4 Allocation requirements

The system must support many-to-many allocations:

-   One settlement/voucher can be allocated to multiple invoices.
-   One invoice can be settled by multiple settlements/vouchers.
-   Partial payments and partial settlements must be supported.
-   Users may allocate manually or use optional FIFO allocation.
-   Show invoice total, adjustments, previous allocations, remaining
    balance and due date during allocation.
-   The sum of allocations must not exceed the settlement/voucher
    amount.
-   An allocation must not exceed the invoice's eligible remaining
    balance without an explicitly authorized exception workflow.
-   Excess money must remain identifiable as an advance or unallocated
    balance.
-   Allocations must be restricted to the correct supplier-buyer
    relationship and direction.
-   Reversal or correction of a posted settlement must restore invoice
    balances and preserve the audit trail.
-   A settlement not involving the agent's cash/bank must not create an
    agent cash receipt or payment entry.

### Example A: One settlement against multiple bills

Settlement amount: ₹50,000

-   Invoice A: ₹20,000
-   Invoice B: ₹15,000
-   Invoice C: ₹15,000

Total allocated: ₹50,000. Unallocated: ₹0.

### Example B: One bill settled in multiple installments

Invoice total: ₹80,000

-   Settlement 1: ₹20,000
-   Settlement 2: ₹25,000
-   Settlement 3: ₹10,000

Remaining balance: ₹25,000, before any other adjustments.

## 8. Outstanding and Aging

Outstanding and aging are core features and must be available at party
and invoice level.

### 8.1 Reports

-   Buyer-wise outstanding owed to suppliers.
-   Supplier-wise outstanding expected from buyers.
-   Bill-wise outstanding.
-   Overdue invoice list.
-   Bills due today, this week and this month.
-   Party aging summary.
-   Historical aging as of a selected date.
-   Top overdue buyers and suppliers.
-   Unallocated settlements and advances.
-   Collection and payment follow-up list.
-   Invoice settlement history.

### 8.2 Default aging buckets

Aging should be calculated from the invoice due date, with configurable
buckets:

-   Not due
-   1--30 days overdue
-   31--60 days overdue
-   61--90 days overdue
-   More than 90 days overdue

Users must also be able to view aging by invoice date. The selected
reporting date must be respected for historical aging.

### 8.3 Balance calculation

For each trade invoice:

`Outstanding = Original Invoice Amount + Balance-Increasing Adjustments − Balance-Reducing Adjustments − Allocated Settlements`

The direction of each adjustment must be explicit and depend on the
supplier-buyer accounting perspective. The system must not simply
subtract every note or payment without validating its effect.

Aging must be based on the remaining eligible balance of each invoice,
not merely the total of all invoices less all settlements for a party.

### 8.4 Dashboard metrics

-   Total trade value recorded
-   Total unsettled trade balance
-   Total overdue balance
-   Amount due in the next 7/30 days
-   Receivables/payables by aging bucket
-   Highest overdue parties
-   Recent settlements
-   Unallocated settlements
-   Returns and adjustment totals

Clearly label these figures as **trade-tracking balances**, not
automatically as the agent's own statutory receivables or payables.

## 9. Party Ledger

Each supplier and buyer must have a detailed ledger view showing:

-   Date
-   Record type
-   Bill/note/settlement number
-   Supplier and buyer
-   Description and reference
-   Debit/credit or increase/decrease direction
-   Transaction amount
-   Adjustment amount
-   Settlement allocation
-   Running balance
-   Due date and aging
-   Link to source record

Users must be able to filter the ledger by date range, record type,
invoice status, LR number and outstanding status, and export it to PDF
or Excel/CSV.

For agency tracking, the system should provide both: - A
supplier-oriented view showing buyer balances owed to that supplier. - A
buyer-oriented view showing amounts the buyer owes to each supplier.

The same underlying trade invoice must not be double-counted in
consolidated trade totals.

## 10. Analytics and Reports

### 10.1 Buyer analytics

-   Invoice value by buyer and period
-   Outstanding and overdue amounts
-   Settlement history and collection trends
-   Average days to settle
-   Return and adjustment totals
-   Highest overdue buyers
-   Average invoice value
-   Transaction frequency

### 10.2 Supplier analytics

-   Invoice value by supplier and period
-   Amount outstanding from buyers for each supplier
-   Settlement history
-   Returns and note totals
-   Highest unsettled supplier balances
-   Average settlement time
-   Transaction trends

### 10.3 Trade and item analytics

-   Meters recorded by fabric/item and period
-   Average rate per meter
-   Trade value by fabric category
-   Transaction count by LR number
-   Supplier-buyer transaction matrix
-   Monthly invoice, return and settlement trends

These are operational analytics, not proof of the agent's own revenue or
inventory movement.

### 10.4 Filters and exports

Relevant reports must support:

-   Date range and financial year
-   Supplier and buyer
-   Item description/category
-   Bill number and LR number
-   Due date and aging bucket
-   Invoice/note/settlement type
-   Paid, partially settled, unsettled and overdue status
-   Payment mode where available
-   Amount range

Reports must support sorting, drill-down and export to Excel/CSV and
printable PDF.

## 11. Optional Commission Register

Commission is not required to be part of the initial invoice-settlement
calculation. The system must be able to enable it later without changing
the meaning of supplier-buyer invoices.

### Fields

-   Commission reference number
-   Supplier, buyer or other responsible party
-   Related trade invoice/transaction, if applicable
-   Commission basis: percentage, rate per meter or fixed amount
-   Rate and calculation basis
-   Commission amount
-   Applicable GST/tax fields
-   Commission invoice/reference
-   Amount billed, received and outstanding
-   Date and remarks
-   Status: Draft, Earned, Billed, Partially Collected, Collected,
    Cancelled

Commission must be recognized in the agent's own accounts only in
accordance with the actual agreement and applicable accounting rules.
The full supplier-buyer invoice value must not be treated as commission
revenue.

## 12. Agent's Own Accounting

The first version may focus on trade tracking, but it must keep a clean
boundary for the agent's own financial records.

If enabled, own accounting should cover:

-   Actual cash and bank receipts/payments
-   Commission income and receivables
-   Business expenses
-   Money received or paid on behalf of a supplier or buyer
-   Appropriate agency/clearing balances
-   Relevant tax records
-   Reconciliation between vouchers and bank/cash balances

A trade settlement marked as paid directly between buyer and supplier
must not change the agent's cash/bank balance. If the agent handles the
money, the corresponding actual receipt/payment and agency-clearing
entries must be recorded consistently.

Full general ledger, trial balance and profit-and-loss reporting may be
implemented as a later phase if not required initially.

## 13. Main Screens

1.  **Dashboard** --- Trade outstanding, aging, overdue balances and
    recent settlements.
2.  **Parties** --- Supplier/buyer master and opening balances.
3.  **Trade Invoices** --- Register and search supplier-to-buyer
    invoices.
4.  **Returns & Notes** --- Returns, debit notes and credit notes.
5.  **Settlements** --- Record payments between buyers and suppliers and
    allocate them to invoices.
6.  **Agent Receipts** --- Actual money received by the agent.
7.  **Agent Payments** --- Actual money paid by the agent.
8.  **Outstanding & Aging** --- Party-wise and bill-wise balances.
9.  **Party Ledger** --- Full transaction history and running balance.
10. **Commission Register** --- Optional commission tracking.
11. **Reports** --- Analytics, exports and follow-up lists.
12. **Settings & Audit** --- Numbering, financial year, permissions and
    audit logs.

## 14. Core Data Model

Recommended entities:

-   `Party`
-   `TradeInvoice`
-   `TradeInvoiceLine`
-   `AdjustmentNote`
-   `Settlement`
-   `SettlementAllocation`
-   `AgentReceiptVoucher`
-   `AgentPaymentVoucher`
-   `CommissionEntry`
-   `CashBankAccount` (if own accounting is enabled)
-   `AccountingEntry` (if general ledger is enabled)
-   `AuditLog`
-   `FinancialYearSettings`

### Important relationships

-   One supplier can have many trade invoices.
-   One buyer can have many trade invoices.
-   Each trade invoice references one supplier and one buyer.
-   One invoice can have multiple adjustment notes.
-   One settlement can allocate to multiple invoices.
-   One invoice can receive allocations from multiple settlements.
-   Agent receipt/payment vouchers are distinct from third-party
    settlement records.
-   Commission entries may reference a trade invoice but remain separate
    from its gross value.

A separate `SettlementAllocation` table is mandatory. Do not store only
one payment-voucher ID on an invoice.

## 15. Data Integrity, Security and Audit

-   Use decimal-safe numeric types for money, quantities and rates.
-   Validate allocation totals and remaining invoice balances.
-   Prevent duplicate allocations and invalid cross-party allocations.
-   Preserve posted invoice values and source-document references.
-   Do not silently delete posted invoices, notes, settlements or
    vouchers.
-   Use cancellation/reversal workflows with reasons.
-   Maintain an audit log of creator, editor, approver,
    posting/cancellation actions and timestamps.
-   Provide role-based access for data entry, posting, approvals,
    reports and administration.
-   Support database backups and recovery.
-   Provide search by party, bill number, LR number, note number and
    settlement reference.
-   Reconcile invoice balances, adjustment directions and allocations
    consistently.

## 16. Acceptance Criteria

The initial release is accepted when all of the following work:

1.  Create suppliers, buyers and parties with both roles.
2.  Record a supplier invoice addressed to a buyer without treating it
    automatically as the agent's own sale or purchase.
3.  Record multiple item lines, meters, rates, discounts, GST, charges
    and deductions.
4.  Link multiple returns and debit/credit notes to one invoice.
5.  Record one settlement allocated to five bills.
6.  Settle one invoice using five separate settlements.
7.  Record excess or advance settlement amounts as unallocated balances.
8.  Track whether a settlement was direct between supplier and buyer or
    handled by the agent.
9.  Ensure direct settlements do not change the agent's cash/bank
    balance.
10. Recalculate invoice outstanding after allocations and valid
    adjustments.
11. Generate supplier-wise, buyer-wise, bill-wise and historical aging
    reports.
12. Show complete party ledgers with traceable source records.
13. Export reports to Excel/CSV and PDF.
14. Reverse a posted settlement and restore the correct invoice balances
    while retaining audit history.
15. Record commission separately without treating the underlying invoice
    value as commission income.
16. Reconcile all displayed trade balances to source invoices,
    adjustments and settlements.

## 17. Implementation Phases

### Phase 1 --- Core trade tracking

-   Party masters
-   Trade invoice entry
-   Settlement records
-   Many-to-many bill allocation
-   Party ledgers
-   Bill-wise outstanding

### Phase 2 --- Adjustments and aging

-   Returns and debit/credit notes
-   Advance/unallocated balances
-   Historical aging
-   Reversals and audit history

### Phase 3 --- Analytics and exports

-   Buyer and supplier dashboards
-   Aging and overdue reports
-   Item and LR analytics
-   Excel/CSV/PDF exports
-   Follow-up reports

### Phase 4 --- Optional agent accounting

-   Commission register
-   Agent cash/bank vouchers
-   Agency-clearing entries
-   General ledger and reconciliation, if required

## 18. Assumptions and Open Accounting Decisions

The following are implementation settings to confirm with the business's
accountant, not reasons to block the core tracking workflow:

-   Whether opening balances are imported bill-by-bill or as summarized
    balances.
-   Whether every settlement requires documentary proof.
-   Whether commission is enabled in the first release.
-   Whether the agent ever physically receives or pays supplier-buyer
    funds.
-   Applicable GST treatment for the agent's own commission and any
    agency/clearing transactions.
-   Whether a full general ledger is required in Version 1 or can be
    added later.

## 19. Final Requirement Summary

Build a simple, reliable cloth commission agency system centered on
supplier-buyer trade invoices, adjustments, settlement allocation,
outstanding and aging. Supplier invoices must remain transactions
between supplier and buyer. The agent's own cash/bank movements and
optional commission must be recorded separately.

The most important functional requirement is a correct many-to-many
allocation model: one settlement can clear multiple bills, and one bill
can be cleared through multiple settlements. All balances and reports
must be traceable to source invoices, notes and settlement allocations.
