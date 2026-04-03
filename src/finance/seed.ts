import { FinanceWorkspaceState } from './types';

export const financeSeed: FinanceWorkspaceState = {
  company: {
    name: 'ConDigital Finance',
    baseCurrency: 'USD',
    fiscalYear: '2026',
  },
  accounts: [
    { id: 'acct-cash-main', code: '1000', name: 'Main Cash', category: 'asset', type: 'cash', cashFlowGroup: 'noncash', isSystem: true },
    { id: 'acct-bank-main', code: '1010', name: 'Bank Current Account', category: 'asset', type: 'bank', cashFlowGroup: 'noncash', isSystem: true },
    { id: 'acct-ar', code: '1100', name: 'Accounts Receivable', category: 'asset', type: 'accounts_receivable', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-inventory', code: '1200', name: 'Inventory', category: 'asset', type: 'inventory', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-equipment', code: '1500', name: 'Office Equipment', category: 'asset', type: 'fixed_asset', cashFlowGroup: 'investing', isSystem: true },
    { id: 'acct-ap', code: '2000', name: 'Accounts Payable', category: 'liability', type: 'accounts_payable', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-vat', code: '2100', name: 'VAT Payable', category: 'liability', type: 'tax_payable', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-loan', code: '2300', name: 'Bank Loan', category: 'liability', type: 'loan', cashFlowGroup: 'financing', isSystem: true },
    { id: 'acct-capital', code: '3000', name: 'Owner Capital', category: 'equity', type: 'capital', cashFlowGroup: 'financing', isSystem: true },
    { id: 'acct-retained', code: '3100', name: 'Retained Earnings', category: 'equity', type: 'retained_earnings', cashFlowGroup: 'noncash', isSystem: true },
    { id: 'acct-sales', code: '4000', name: 'Sales Revenue', category: 'revenue', type: 'sales', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-other-income', code: '4100', name: 'Other Income', category: 'revenue', type: 'other_income', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-cogs', code: '5000', name: 'Cost of Goods Sold', category: 'expense', type: 'cost_of_sales', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-rent', code: '6100', name: 'Rent Expense', category: 'expense', type: 'operating_expense', cashFlowGroup: 'operating', isSystem: true },
    { id: 'acct-salary', code: '6200', name: 'Salary Expense', category: 'expense', type: 'operating_expense', cashFlowGroup: 'operating', isSystem: true },
  ],
  entries: [
    {
      id: 'je-001',
      date: '2026-01-02',
      reference: 'OPEN-001',
      memo: 'Owner capital introduced',
      source: 'system',
      lines: [
        { accountId: 'acct-bank-main', debit: 25000, credit: 0 },
        { accountId: 'acct-capital', debit: 0, credit: 25000 },
      ],
    },
    {
      id: 'je-002',
      date: '2026-01-05',
      reference: 'INV-1001',
      memo: 'Cash sale posted',
      source: 'system',
      lines: [
        { accountId: 'acct-bank-main', debit: 6200, credit: 0 },
        { accountId: 'acct-sales', debit: 0, credit: 6200 },
      ],
    },
    {
      id: 'je-003',
      date: '2026-01-06',
      reference: 'BILL-230',
      memo: 'Inventory purchased on credit',
      source: 'system',
      lines: [
        { accountId: 'acct-inventory', debit: 1800, credit: 0 },
        { accountId: 'acct-ap', debit: 0, credit: 1800 },
      ],
    },
    {
      id: 'je-004',
      date: '2026-01-09',
      reference: 'PAY-301',
      memo: 'Rent paid from bank',
      source: 'system',
      lines: [
        { accountId: 'acct-rent', debit: 950, credit: 0 },
        { accountId: 'acct-bank-main', debit: 0, credit: 950 },
      ],
    },
    {
      id: 'je-005',
      date: '2026-01-12',
      reference: 'ASSET-100',
      memo: 'Laptop purchased with bank funds',
      source: 'system',
      lines: [
        { accountId: 'acct-equipment', debit: 3200, credit: 0 },
        { accountId: 'acct-bank-main', debit: 0, credit: 3200 },
      ],
    },
    {
      id: 'je-006',
      date: '2026-01-18',
      reference: 'LOAN-001',
      memo: 'Bank loan proceeds received',
      source: 'system',
      lines: [
        { accountId: 'acct-bank-main', debit: 10000, credit: 0 },
        { accountId: 'acct-loan', debit: 0, credit: 10000 },
      ],
    },
    {
      id: 'je-007',
      date: '2026-01-24',
      reference: 'PAY-335',
      memo: 'Salary payment',
      source: 'system',
      lines: [
        { accountId: 'acct-salary', debit: 1600, credit: 0 },
        { accountId: 'acct-bank-main', debit: 0, credit: 1600 },
      ],
    },
  ],
};
