import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, Building2, FileSpreadsheet, Landmark, PlusCircle, Wallet } from 'lucide-react';
import { fetchFinanceWorkspace, saveFinanceWorkspace } from '../finance/api';
import { buildLedgerForAccount, calculateAccountingSummary, formatMoney } from '../finance/engine';
import { financeSeed } from '../finance/seed';
import { FinanceAccount, FinanceWorkspaceState, JournalEntry, JournalLine } from '../finance/types';

type ModuleKey = 'overview' | 'accounts' | 'journals' | 'trial-balance' | 'cashflow' | 'roadmap';

const modules: Array<{ key: ModuleKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'accounts', label: 'Accounts', icon: Landmark },
  { key: 'journals', label: 'Journals', icon: BookOpen },
  { key: 'trial-balance', label: 'Trial Balance', icon: FileSpreadsheet },
  { key: 'cashflow', label: 'Cashflow', icon: Wallet },
  { key: 'roadmap', label: 'Roadmap', icon: BarChart3 },
];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyLine(accountId = ''): JournalLine {
  return { accountId, debit: 0, credit: 0 };
}

export function FinanceWorkbench() {
  const [workspace, setWorkspace] = useState<FinanceWorkspaceState>(financeSeed);
  const [activeModule, setActiveModule] = useState<ModuleKey>('overview');
  const [selectedLedgerId, setSelectedLedgerId] = useState(financeSeed.accounts[1].id);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    category: 'asset',
    type: 'other_asset',
    cashFlowGroup: 'operating',
  });
  const [entryForm, setEntryForm] = useState({
    date: '2026-04-03',
    reference: '',
    memo: '',
    lines: [emptyLine(financeSeed.accounts[1].id), emptyLine(financeSeed.accounts[10].id)],
  });

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const remoteWorkspace = await fetchFinanceWorkspace();
        if (!isMounted) return;
        setWorkspace(remoteWorkspace);
        setSelectedLedgerId(remoteWorkspace.accounts[1]?.id ?? remoteWorkspace.accounts[0]?.id ?? financeSeed.accounts[1].id);
      } catch (error) {
        console.error('Failed to load finance workspace', error);
        if (!isMounted) return;
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const timer = window.setTimeout(() => {
      setSyncState('saving');
      void saveFinanceWorkspace(workspace)
        .then(() => setSyncState('saved'))
        .catch((error) => {
          console.error('Failed to save finance workspace', error);
          setSyncState('error');
        });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [workspace, loading]);

  const summary = useMemo(() => calculateAccountingSummary(workspace), [workspace]);
  const ledgerRows = useMemo(() => buildLedgerForAccount(workspace, selectedLedgerId), [workspace, selectedLedgerId]);
  const currency = workspace.company.baseCurrency;
  const totalDebits = entryForm.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredits = entryForm.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const entryBalanced = totalDebits > 0 && totalDebits === totalCredits;

  function updateLine(index: number, patch: Partial<JournalLine>) {
    setEntryForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    }));
  }

  function addAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!accountForm.code.trim() || !accountForm.name.trim()) return;

    const account: FinanceAccount = {
      id: makeId('acct'),
      code: accountForm.code.trim(),
      name: accountForm.name.trim(),
      category: accountForm.category as FinanceAccount['category'],
      type: accountForm.type as FinanceAccount['type'],
      cashFlowGroup: accountForm.cashFlowGroup as FinanceAccount['cashFlowGroup'],
      isSystem: false,
    };

    setWorkspace((current) => ({
      ...current,
      accounts: [...current.accounts, account].sort((a, b) => a.code.localeCompare(b.code)),
    }));
    setAccountForm({ code: '', name: '', category: 'asset', type: 'other_asset', cashFlowGroup: 'operating' });
  }

  function addJournalEntry(event: React.FormEvent) {
    event.preventDefault();
    if (!entryBalanced) return;

    const lines = entryForm.lines
      .filter((line) => line.accountId && (Number(line.debit) > 0 || Number(line.credit) > 0))
      .map((line) => ({
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }));

    if (lines.length < 2) return;

    const entry: JournalEntry = {
      id: makeId('je'),
      date: entryForm.date,
      reference: entryForm.reference.trim() || makeId('REF').toUpperCase(),
      memo: entryForm.memo.trim(),
      source: 'manual',
      lines,
    };

    setWorkspace((current) => ({
      ...current,
      entries: [...current.entries, entry].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setEntryForm({
      date: entryForm.date,
      reference: '',
      memo: '',
      lines: [emptyLine(financeSeed.accounts[1].id), emptyLine(financeSeed.accounts[10].id)],
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f0e6]">
        <div className="rounded-[32px] border border-[#ddcfbd] bg-white px-8 py-7 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8b6644]">Finsheet</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#241b13]">Loading finance workspace</h1>
          <p className="mt-3 text-sm text-[#725842]">Connecting to the hosted accounting database and preparing shared data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f0e6] text-[#241b13]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="w-[280px] shrink-0 border-r border-[#d8cab8] bg-[#18130f] p-4 text-[#f6eadb]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#f1c98c]">ConDigital</p>
            <h1 className="mt-3 text-2xl font-semibold">{workspace.company.name}</h1>
            <p className="mt-2 text-sm text-[#dccab2]">Sage 50 inspired accounting workspace</p>
          </div>
          <nav className="mt-6 space-y-2">
            {modules.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveModule(key)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                  activeModule === key ? 'bg-[#f1dfca] text-[#241b13]' : 'hover:bg-white/6'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <header className="rounded-[32px] border border-[#ddcfbd] bg-[linear-gradient(135deg,#fffaf5,#f3e2cf)] p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8b6644]">ERP Workspace</p>
            <h2 className="mt-3 text-3xl font-semibold">{modules.find((item) => item.key === activeModule)?.label}</h2>
            <p className="mt-3 max-w-4xl text-sm text-[#725842]">
              Phase 1 turns the project into a working accounting core with chart of accounts, journal posting, trial balance, general ledger drilldown, and cashflow summary.
            </p>
            <div className="mt-4 inline-flex rounded-full border border-[#ddcfbd] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#725842]">
              {syncState === 'saving' && 'Saving'}
              {syncState === 'saved' && 'Saved to server'}
              {syncState === 'error' && 'Sync error'}
              {syncState === 'idle' && 'Connected'}
            </div>
          </header>

          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Current Cash', value: formatMoney(summary.cashFlow.closingCash, currency) },
              { label: 'Net Profit', value: formatMoney(summary.netProfit, currency) },
              { label: 'Assets', value: formatMoney(summary.totals.assets, currency) },
              { label: 'Posted Entries', value: String(summary.entriesCount) },
            ].map((item) => (
              <div key={item.label} className="rounded-[28px] border border-[#ddcfbd] bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8b6644]">{item.label}</p>
                <p className="mt-4 text-3xl font-semibold">{item.value}</p>
              </div>
            ))}
          </section>

          {activeModule === 'overview' && (
            <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr,0.9fr]">
              <div className="rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold">Trial Balance Snapshot</h3>
                <div className="mt-6 overflow-hidden rounded-3xl border border-[#eadfce]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f7f0e6] text-[#8b6644]">
                      <tr><th className="px-5 py-4">Code</th><th className="px-5 py-4">Account</th><th className="px-5 py-4">Debit</th><th className="px-5 py-4">Credit</th></tr>
                    </thead>
                    <tbody>
                      {summary.trialBalance.slice(0, 8).map((row) => (
                        <tr key={row.accountId} className="border-t border-[#f0e7db]">
                          <td className="px-5 py-4 font-mono text-xs">{row.code}</td>
                          <td className="px-5 py-4">{row.name}</td>
                          <td className="px-5 py-4">{row.debit ? formatMoney(row.debit, currency) : '-'}</td>
                          <td className="px-5 py-4">{row.credit ? formatMoney(row.credit, currency) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-[#ddcfbd] bg-[#241b13] p-7 text-[#f7f0e6] shadow-sm">
                  <h3 className="text-2xl font-semibold">Cashflow Formula</h3>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between rounded-2xl bg-white/6 px-4 py-3"><span>Operating</span><strong>{formatMoney(summary.cashFlow.operating, currency)}</strong></div>
                    <div className="flex justify-between rounded-2xl bg-white/6 px-4 py-3"><span>Investing</span><strong>{formatMoney(summary.cashFlow.investing, currency)}</strong></div>
                    <div className="flex justify-between rounded-2xl bg-white/6 px-4 py-3"><span>Financing</span><strong>{formatMoney(summary.cashFlow.financing, currency)}</strong></div>
                    <div className="flex justify-between rounded-2xl bg-[#f1dfca] px-4 py-3 text-[#241b13]"><span>Closing Cash</span><strong>{formatMoney(summary.cashFlow.closingCash, currency)}</strong></div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
                  <h3 className="text-2xl font-semibold">Ledger Drilldown</h3>
                  <select value={selectedLedgerId} onChange={(event) => setSelectedLedgerId(event.target.value)} className="mt-4 w-full rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none">
                    {workspace.accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}
                  </select>
                  <div className="mt-4 space-y-3">
                    {ledgerRows.slice(-4).map((row) => (
                      <div key={`${row.entryId}-${row.date}-${row.debit}-${row.credit}`} className="rounded-2xl border border-[#f0e7db] bg-[#fcfaf7] p-4 text-sm">
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-semibold">{row.reference}</p>
                            <p className="text-xs text-[#7b5f46]">{row.memo}</p>
                          </div>
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b6644]">{row.date}</span>
                        </div>
                        <div className="mt-3 flex justify-between">
                          <span>Running Balance</span>
                          <strong>{formatMoney(row.runningBalance, currency)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'accounts' && (
            <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr,1.3fr]">
              <form onSubmit={addAccount} className="rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold">Add Account</h3>
                <div className="mt-5 space-y-4">
                  <input value={accountForm.code} onChange={(event) => setAccountForm((current) => ({ ...current, code: event.target.value }))} placeholder="Account code" className="w-full rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none" />
                  <input value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} placeholder="Account name" className="w-full rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none" />
                  <select value={accountForm.category} onChange={(event) => setAccountForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none">
                    <option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option>
                  </select>
                  <select value={accountForm.type} onChange={(event) => setAccountForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none">
                    <option value="other_asset">Other Asset</option><option value="accounts_receivable">Accounts Receivable</option><option value="inventory">Inventory</option><option value="fixed_asset">Fixed Asset</option><option value="accounts_payable">Accounts Payable</option><option value="tax_payable">Tax Payable</option><option value="loan">Loan</option><option value="capital">Capital</option><option value="retained_earnings">Retained Earnings</option><option value="sales">Sales</option><option value="other_income">Other Income</option><option value="cost_of_sales">Cost of Sales</option><option value="operating_expense">Operating Expense</option>
                  </select>
                  <select value={accountForm.cashFlowGroup} onChange={(event) => setAccountForm((current) => ({ ...current, cashFlowGroup: event.target.value }))} className="w-full rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none">
                    <option value="operating">Operating</option><option value="investing">Investing</option><option value="financing">Financing</option><option value="noncash">Non-cash</option>
                  </select>
                </div>
                <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#241b13] px-5 py-3 text-sm font-semibold text-[#f7f0e6]"><PlusCircle size={18} />Add Account</button>
              </form>

              <div className="rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold">Chart of Accounts</h3>
                <div className="mt-6 overflow-hidden rounded-3xl border border-[#eadfce]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f7f0e6] text-[#8b6644]">
                      <tr><th className="px-5 py-4">Code</th><th className="px-5 py-4">Name</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Cashflow</th></tr>
                    </thead>
                    <tbody>
                      {workspace.accounts.map((account) => (
                        <tr key={account.id} className="border-t border-[#f0e7db]">
                          <td className="px-5 py-4 font-mono text-xs">{account.code}</td>
                          <td className="px-5 py-4">{account.name}</td>
                          <td className="px-5 py-4 capitalize">{account.category}</td>
                          <td className="px-5 py-4 capitalize">{account.cashFlowGroup}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'journals' && (
            <div className="mt-8 grid gap-8 xl:grid-cols-[1fr,1.2fr]">
              <form onSubmit={addJournalEntry} className="rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold">Post Journal Entry</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <input type="date" value={entryForm.date} onChange={(event) => setEntryForm((current) => ({ ...current, date: event.target.value }))} className="rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none" />
                  <input value={entryForm.reference} onChange={(event) => setEntryForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Reference" className="rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none" />
                </div>
                <textarea value={entryForm.memo} onChange={(event) => setEntryForm((current) => ({ ...current, memo: event.target.value }))} placeholder="Entry memo" rows={3} className="mt-4 w-full rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 outline-none" />
                <div className="mt-5 space-y-3">
                  {entryForm.lines.map((line, index) => (
                    <div key={index} className="grid gap-3 rounded-3xl border border-[#eadfce] bg-[#fcfaf7] p-4 md:grid-cols-[1.4fr,0.7fr,0.7fr]">
                      <select value={line.accountId} onChange={(event) => updateLine(index, { accountId: event.target.value })} className="rounded-2xl border border-[#ddcfbd] bg-white px-4 py-3 outline-none">
                        <option value="">Select account</option>
                        {workspace.accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}
                      </select>
                      <input type="number" min="0" step="0.01" value={line.debit || ''} onChange={(event) => updateLine(index, { debit: Number(event.target.value || 0), credit: 0 })} placeholder="Debit" className="rounded-2xl border border-[#ddcfbd] bg-white px-4 py-3 outline-none" />
                      <input type="number" min="0" step="0.01" value={line.credit || ''} onChange={(event) => updateLine(index, { credit: Number(event.target.value || 0), debit: 0 })} placeholder="Credit" className="rounded-2xl border border-[#ddcfbd] bg-white px-4 py-3 outline-none" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setEntryForm((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))} className="rounded-2xl border border-[#ddcfbd] bg-[#fcfaf7] px-4 py-3 text-sm font-semibold">Add Line</button>
                  <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${entryBalanced ? 'bg-[#ebf7ef] text-[#26704a]' : 'bg-[#fff0ee] text-[#9b463d]'}`}>Debits {formatMoney(totalDebits, currency)} | Credits {formatMoney(totalCredits, currency)}</div>
                </div>
                <button type="submit" disabled={!entryBalanced} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#241b13] px-5 py-3 text-sm font-semibold text-[#f7f0e6] disabled:opacity-50"><PlusCircle size={18} />Post Entry</button>
              </form>

              <div className="rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold">Posted Journal</h3>
                <div className="mt-5 space-y-4">
                  {[...workspace.entries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
                    <div key={entry.id} className="rounded-3xl border border-[#eadfce] bg-[#fcfaf7] p-5">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-semibold">{entry.reference}</p>
                          <p className="text-sm text-[#7b5f46]">{entry.memo || 'No memo'}</p>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b6644]">{entry.date}</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        {entry.lines.map((line, index) => {
                          const account = workspace.accounts.find((item) => item.id === line.accountId);
                          return <div key={`${entry.id}-${index}`} className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm"><span>{account ? `${account.code} - ${account.name}` : line.accountId}</span><strong>{line.debit ? `DR ${formatMoney(line.debit, currency)}` : `CR ${formatMoney(line.credit, currency)}`}</strong></div>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeModule === 'trial-balance' && (
            <div className="mt-8 rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
              <h3 className="text-2xl font-semibold">Trial Balance</h3>
              <div className="mt-6 overflow-hidden rounded-3xl border border-[#eadfce]">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f7f0e6] text-[#8b6644]">
                    <tr><th className="px-5 py-4">Code</th><th className="px-5 py-4">Account</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Debit</th><th className="px-5 py-4">Credit</th></tr>
                  </thead>
                  <tbody>
                    {summary.trialBalance.map((row) => (
                      <tr key={row.accountId} className="border-t border-[#f0e7db]">
                        <td className="px-5 py-4 font-mono text-xs">{row.code}</td>
                        <td className="px-5 py-4">{row.name}</td>
                        <td className="px-5 py-4 capitalize">{row.category}</td>
                        <td className="px-5 py-4">{row.debit ? formatMoney(row.debit, currency) : '-'}</td>
                        <td className="px-5 py-4">{row.credit ? formatMoney(row.credit, currency) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeModule === 'cashflow' && (
            <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
              <div className="rounded-[32px] border border-[#ddcfbd] bg-[#241b13] p-7 text-[#f7f0e6] shadow-sm">
                <h3 className="text-2xl font-semibold">Cashflow</h3>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between rounded-2xl bg-white/6 px-4 py-3"><span>Opening cash</span><strong>{formatMoney(summary.cashFlow.openingCash, currency)}</strong></div>
                  <div className="flex justify-between rounded-2xl bg-white/6 px-4 py-3"><span>Operating</span><strong>{formatMoney(summary.cashFlow.operating, currency)}</strong></div>
                  <div className="flex justify-between rounded-2xl bg-white/6 px-4 py-3"><span>Investing</span><strong>{formatMoney(summary.cashFlow.investing, currency)}</strong></div>
                  <div className="flex justify-between rounded-2xl bg-white/6 px-4 py-3"><span>Financing</span><strong>{formatMoney(summary.cashFlow.financing, currency)}</strong></div>
                  <div className="flex justify-between rounded-2xl bg-[#f1dfca] px-4 py-3 text-[#241b13]"><span>Closing cash</span><strong>{formatMoney(summary.cashFlow.closingCash, currency)}</strong></div>
                </div>
              </div>
              <div className="rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-semibold">What Comes Next</h3>
                <div className="mt-5 space-y-4 text-sm text-[#4d3b2c]">
                  <div className="rounded-3xl border border-[#eadfce] bg-[#fcfaf7] p-5">Add beginning balances, profit and loss, balance sheet, and period close controls.</div>
                  <div className="rounded-3xl border border-[#eadfce] bg-[#fcfaf7] p-5">Then build receivables, payables, inventory, assets, payroll, and tax as subledgers that post into the GL.</div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'roadmap' && (
            <div className="mt-8 rounded-[32px] border border-[#ddcfbd] bg-white p-7 shadow-sm">
              <h3 className="text-2xl font-semibold">SDLC Roadmap</h3>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {['Phase 1: Core accounting', 'Phase 2: Statements and periods', 'Phase 3: Receivables', 'Phase 4: Payables', 'Phase 5: Banking', 'Phase 6: Inventory and projects', 'Phase 7: Fixed assets', 'Phase 8: Payroll', 'Phase 9: Tax and declarations'].map((item) => (
                  <div key={item} className="rounded-3xl border border-[#eadfce] bg-[#fcfaf7] p-5 text-sm font-semibold">{item}</div>
                ))}
              </div>
              <p className="mt-6 text-sm text-[#725842]">The full written plan is in `docs/condigital-erp-plan.md`.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
