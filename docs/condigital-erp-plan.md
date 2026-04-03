# ConDigital Finance ERP Plan

## Product Direction

Build a Sage 50 / Peachtree-inspired financial management system on top of the current React + TypeScript codebase.

The source PDF indicates these major capability areas:

- General Ledger
- Beginning Balances
- Trial Balance
- Customer Ledger and Customer Trial Balance
- Vendor Ledger
- Project Ledger and Project Trial Balance
- Balance Sheet
- Income Statement
- Cashflow
- GL Account Summary
- VAT and Withholding declarations
- Sales and Purchase summaries
- Inventory and inventory adjustment journal
- Assets and depreciation
- Banking and reconciliation
- Payroll, payslip, loans, overtime, pension, tax, variance reports

## SDLC

### 1. Discovery and Scope Control

- Normalize Figma and PDF inputs into product requirements.
- Convert report names into functional modules and data entities.
- Lock accounting conventions early:
  - double-entry posting
  - account categories
  - fiscal period behavior
  - posting and approval states

### 2. Domain and Data Design

- Define master data:
  - companies
  - fiscal periods
  - chart of accounts
  - customers
  - vendors
  - projects
  - items
  - fixed assets
  - employees
  - bank accounts
- Define transactional data:
  - journal entries
  - sales invoices
  - purchase bills
  - receipts
  - payments
  - payroll runs
  - stock adjustments
  - depreciation runs
  - tax declarations

### 3. UX and Navigation

- Use Sage 50 concepts:
  - left navigation for modules
  - operational workspace in the center
  - summary cards and report drill-down
  - accounting-first terminology
- Keep the UI practical and dense enough for finance work, not marketing-style.

### 4. Implementation

- Build the accounting engine first.
- Add subledgers on top of the GL instead of bypassing it.
- Keep every phase functional end-to-end before expanding scope.

### 5. Verification

- Validate every posting with balanced debits and credits.
- Reconcile reports from the same dataset:
  - GL -> Trial Balance -> Balance Sheet / Income Statement / Cashflow
- Add seeded realistic finance data for walkthroughs.

### 6. UAT and Release

- Review with business users module by module.
- Freeze formulas before moving into tax and payroll.

## Delivery Phases

### Phase 1: Accounting Core

- Company workspace shell
- Chart of accounts
- Journal entry posting
- General ledger view
- Trial balance
- Cashflow summary
- Local persistence for finance workspace

### Phase 2: Periods and Financial Statements

- Fiscal periods
- Opening balances
- Profit and loss
- Balance sheet
- GL account summary
- Report filters and exports

### Phase 3: Receivables

- Customers
- Sales invoices
- Receipts
- Customer ledger
- Customer trial balance
- VAT on sales

### Phase 4: Payables

- Vendors
- Purchase bills
- Supplier payments
- Vendor ledger
- Withholding support
- Purchase summary

### Phase 5: Banking and Reconciliation

- Bank accounts
- Cash account register
- Bank reconciliation
- Transfer journal flows

### Phase 6: Inventory and Projects

- Items and stock balances
- Inventory adjustment journal
- Cost of goods sold support
- Project ledger and project trial balance

### Phase 7: Fixed Assets

- Asset register
- Depreciation setup
- Depreciation journals
- Asset movement reports

### Phase 8: Payroll

- Employees
- Payroll settings
- Salary, overtime, loans, pension, income tax
- Payroll journals
- Payslips
- Variance reports

### Phase 9: Tax and Compliance

- VAT declaration
- Withholding declaration
- Income tax support
- Balance sheet tax declarations

## Current Implementation Decision

This iteration starts with Phase 1 because all later modules depend on a reliable accounting core.
