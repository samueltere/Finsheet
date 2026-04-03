import { CashFlowSummary, FinanceAccount, FinanceWorkspaceState, JournalEntry, LedgerRow, TrialBalanceRow } from './types';

export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function isCashAccount(account: FinanceAccount) {
  return account.type === 'cash' || account.type === 'bank';
}

export function calculateSignedBalance(account: FinanceAccount, entries: JournalEntry[]) {
  let signed = 0;

  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.accountId !== account.id) continue;
      signed += line.debit - line.credit;
    }
  }

  return signed;
}

export function buildTrialBalance(state: FinanceWorkspaceState): TrialBalanceRow[] {
  return state.accounts
    .map((account) => {
      const signed = calculateSignedBalance(account, state.entries);
      const debit = signed > 0 ? signed : 0;
      const credit = signed < 0 ? Math.abs(signed) : 0;

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        category: account.category,
        debit,
        credit,
        balance: signed,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function buildLedgerForAccount(state: FinanceWorkspaceState, accountId: string): LedgerRow[] {
  const rows: LedgerRow[] = [];
  let runningBalance = 0;

  const entries = [...state.entries].sort((a, b) => a.date.localeCompare(b.date));
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.accountId !== accountId) continue;
      runningBalance += line.debit - line.credit;
      rows.push({
        entryId: entry.id,
        date: entry.date,
        reference: entry.reference,
        memo: line.memo || entry.memo,
        debit: line.debit,
        credit: line.credit,
        runningBalance,
      });
    }
  }

  return rows;
}

export function calculateCashFlow(state: FinanceWorkspaceState): CashFlowSummary {
  const accountMap = new Map(state.accounts.map((account) => [account.id, account]));
  let operating = 0;
  let investing = 0;
  let financing = 0;

  for (const entry of state.entries) {
    const hasCash = entry.lines.some((line) => {
      const account = accountMap.get(line.accountId);
      return account ? isCashAccount(account) : false;
    });

    if (!hasCash) continue;

    for (const line of entry.lines) {
      const account = accountMap.get(line.accountId);
      if (!account || isCashAccount(account) || account.cashFlowGroup === 'noncash') continue;

      const movement = line.credit - line.debit;
      if (account.cashFlowGroup === 'operating') operating += movement;
      if (account.cashFlowGroup === 'investing') investing += movement;
      if (account.cashFlowGroup === 'financing') financing += movement;
    }
  }

  const openingCash = 0;
  const closingCash = state.accounts
    .filter(isCashAccount)
    .reduce((sum, account) => sum + calculateSignedBalance(account, state.entries), 0);

  return {
    operating,
    investing,
    financing,
    netChange: operating + investing + financing,
    openingCash,
    closingCash,
  };
}

export function calculateAccountingSummary(state: FinanceWorkspaceState) {
  const trialBalance = buildTrialBalance(state);

  const totals = {
    assets: 0,
    liabilities: 0,
    equity: 0,
    revenue: 0,
    expense: 0,
  };

  for (const row of trialBalance) {
    if (row.category === 'asset') totals.assets += row.balance;
    if (row.category === 'expense') totals.expense += row.balance;
    if (row.category === 'liability') totals.liabilities += Math.abs(row.balance);
    if (row.category === 'equity') totals.equity += Math.abs(row.balance);
    if (row.category === 'revenue') totals.revenue += Math.abs(row.balance);
  }

  const cashFlow = calculateCashFlow(state);
  const netProfit = totals.revenue - totals.expense;

  return {
    trialBalance,
    cashFlow,
    totals,
    netProfit,
    entriesCount: state.entries.length,
  };
}
