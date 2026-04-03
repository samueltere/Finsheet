export type FinanceAccountCategory =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';

export type FinanceAccountType =
  | 'cash'
  | 'bank'
  | 'accounts_receivable'
  | 'inventory'
  | 'fixed_asset'
  | 'other_asset'
  | 'accounts_payable'
  | 'tax_payable'
  | 'loan'
  | 'other_liability'
  | 'capital'
  | 'retained_earnings'
  | 'sales'
  | 'other_income'
  | 'cost_of_sales'
  | 'operating_expense';

export type CashFlowGroup = 'operating' | 'investing' | 'financing' | 'noncash';

export interface FinanceCompany {
  name: string;
  baseCurrency: string;
  fiscalYear: string;
}

export interface FinanceAccount {
  id: string;
  code: string;
  name: string;
  category: FinanceAccountCategory;
  type: FinanceAccountType;
  cashFlowGroup: CashFlowGroup;
  isSystem: boolean;
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  memo: string;
  source: 'manual' | 'system';
  lines: JournalLine[];
}

export interface FinanceWorkspaceState {
  company: FinanceCompany;
  accounts: FinanceAccount[];
  entries: JournalEntry[];
}

export interface LedgerRow {
  entryId: string;
  date: string;
  reference: string;
  memo: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  category: FinanceAccountCategory;
  debit: number;
  credit: number;
  balance: number;
}

export interface CashFlowSummary {
  operating: number;
  investing: number;
  financing: number;
  netChange: number;
  openingCash: number;
  closingCash: number;
}
