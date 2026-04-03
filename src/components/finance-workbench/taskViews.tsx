import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Plus, Save, Trash2 } from 'lucide-react';
import { buildLedgerForAccount, calculateSignedBalance, formatMoney } from '../../finance/engine';
import type { FinanceAccount, FinanceWorkspaceState, JournalEntry } from '../../finance/types';
import { CompanyRow, CustomerRow, InventoryRow, TaskKey, VendorRow, taskLabel, taskMenuItems } from './data';
import { Panel } from './shared';

type TaskWorkspaceProps = {
  activeTask: TaskKey;
  workspace: FinanceWorkspaceState;
  setWorkspace: React.Dispatch<React.SetStateAction<FinanceWorkspaceState>>;
  customers: CustomerRow[];
  vendors: VendorRow[];
  inventories: InventoryRow[];
  companies: CompanyRow[];
  onBack: () => void;
};

type DocumentLine = {
  id: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string;
  taxType: string;
  project: string;
};

const projectOptions = ['Operations', 'Retail', 'Construction', 'Internal'];
const taxTypes = ['VAT 0%', 'VAT 15%', 'VAT Exempt'];

function createLine(): DocumentLine {
  return {
    id: crypto.randomUUID(),
    itemId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    accountId: '',
    taxType: 'VAT 15%',
    project: 'Operations',
  };
}

function findAccountByType(workspace: FinanceWorkspaceState, type: FinanceAccount['type']) {
  return workspace.accounts.find((account) => account.type === type);
}

function appendEntry(setWorkspace: React.Dispatch<React.SetStateAction<FinanceWorkspaceState>>, entry: JournalEntry) {
  setWorkspace((current) => ({
    ...current,
    entries: [...current.entries, entry],
  }));
}

function ToolbarButton({ label }: { label: string }) {
  return <button className="fin-action-btn rounded-xl px-3 py-2 text-[12px] font-medium">{label}</button>;
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-[12px] text-[#52635d]">
      <span className="block">{required ? `* ${label}` : label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`fin-input h-11 w-full rounded-2xl px-3 text-[13px] ${props.className ?? ''}`} />;
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`fin-input h-11 w-full appearance-none rounded-2xl px-3 pr-9 text-[13px] ${props.className ?? ''}`} />
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#748781]" />
    </div>
  );
}

function AmountBox({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'debit' | 'credit' }) {
  const toneClass =
    tone === 'debit'
      ? 'border-[#9ed2bd] bg-[#edf9f4] text-[#1f6d54]'
      : tone === 'credit'
        ? 'border-[#e2b19d] bg-[#fcf2ee] text-[#9a5339]'
        : 'border-[#dbe5df] bg-white/70 text-[#31423c]';

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function DocumentTable({
  lines,
  setLines,
  inventories,
  accountOptions,
  currency,
}: {
  lines: DocumentLine[];
  setLines: React.Dispatch<React.SetStateAction<DocumentLine[]>>;
  inventories: InventoryRow[];
  accountOptions: FinanceAccount[];
  currency: string;
}) {
  const updateLine = (lineId: string, patch: Partial<DocumentLine>) => {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  };

  const removeLine = (lineId: string) => {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== lineId) : current));
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#dbe5df] bg-white/70">
      <div className="overflow-x-auto">
        <table className="fin-table min-w-full text-[12px]">
          <thead className="fin-panel-header fin-table-head text-left">
            <tr>
              <th className="px-3 py-3 font-medium">Qty</th>
              <th className="px-3 py-3 font-medium">Item</th>
              <th className="px-3 py-3 font-medium">Description</th>
              <th className="px-3 py-3 font-medium">Unit Price</th>
              <th className="px-3 py-3 font-medium">GL Account</th>
              <th className="px-3 py-3 font-medium">Project</th>
              <th className="px-3 py-3 font-medium">Tax Type</th>
              <th className="px-3 py-3 font-medium text-right">Amount</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const amount = line.quantity * line.unitPrice;
              return (
                <tr key={line.id} className="fin-table-row align-top">
                  <td className="px-3 py-2">
                    <TextInput type="number" min="1" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) || 0 })} />
                  </td>
                  <td className="px-3 py-2">
                    <SelectInput value={line.itemId} onChange={(event) => updateLine(line.id, { itemId: event.target.value, description: inventories.find((item) => String(item.itemId) === event.target.value)?.itemName ?? line.description })}>
                      <option value="">Select inventory</option>
                      {inventories.map((item) => (
                        <option key={item.id} value={item.itemId}>
                          {item.itemName}
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="px-3 py-2">
                    <TextInput value={line.description} onChange={(event) => updateLine(line.id, { description: event.target.value })} />
                  </td>
                  <td className="px-3 py-2">
                    <TextInput type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: Number(event.target.value) || 0 })} />
                  </td>
                  <td className="px-3 py-2">
                    <SelectInput value={line.accountId} onChange={(event) => updateLine(line.id, { accountId: event.target.value })}>
                      <option value="">Select account</option>
                      {accountOptions.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="px-3 py-2">
                    <SelectInput value={line.project} onChange={(event) => updateLine(line.id, { project: event.target.value })}>
                      {projectOptions.map((project) => (
                        <option key={project} value={project}>
                          {project}
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="px-3 py-2">
                    <SelectInput value={line.taxType} onChange={(event) => updateLine(line.id, { taxType: event.target.value })}>
                      {taxTypes.map((taxType) => (
                        <option key={taxType} value={taxType}>
                          {taxType}
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(amount, currency)}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="rounded-xl p-2 text-[#9a5339] hover:bg-[#fcf2ee]" onClick={() => removeLine(line.id)} type="button">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#dbe5df] p-3">
        <button className="fin-action-btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium" onClick={() => setLines((current) => [...current, createLine()])} type="button">
          <Plus size={14} />
          Add Item
        </button>
      </div>
    </div>
  );
}

function TaskHeader({
  activeTask,
  onBack,
  rightStatus,
}: {
  activeTask: TaskKey;
  onBack: () => void;
  rightStatus: string;
}) {
  const taskMeta = taskMenuItems.find((item) => item.key === activeTask)!;
  return (
    <div className="mb-5 flex items-start justify-between gap-4 rounded-[24px] border border-[#dbe5df] bg-white/65 px-5 py-4">
      <div className="space-y-2">
        <button className="fin-link inline-flex items-center gap-2 text-[12px] font-medium hover:underline" onClick={onBack}>
          <ArrowLeft size={14} />
          Back to workspace
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#71857e]">Tasks</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#172126]">{taskLabel(activeTask)}</h2>
          <p className="mt-1 max-w-3xl text-[13px] text-[#5c6c67]">{taskMeta.description}</p>
        </div>
      </div>
      <div className="fin-status-pill rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">{rightStatus}</div>
    </div>
  );
}

function SalesOrderTask({ workspace, customers, inventories, onBack }: { workspace: FinanceWorkspaceState; customers: CustomerRow[]; inventories: InventoryRow[]; onBack: () => void }) {
  const [status, setStatus] = useState('Draft');
  const [customerId, setCustomerId] = useState(String(customers[0]?.id ?? ''));
  const [orderDate, setOrderDate] = useState('2026-04-03');
  const [reference, setReference] = useState(`SO-${String(workspace.entries.length + 1).padStart(6, '0')}`);
  const [transactionType, setTransactionType] = useState('Goods');
  const [origin, setOrigin] = useState('Local');
  const [shipBy, setShipBy] = useState('Truck');
  const [lines, setLines] = useState<DocumentLine[]>([
    {
      ...createLine(),
      accountId: findAccountByType(workspace, 'sales')?.id ?? '',
    },
  ]);

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const customer = customers.find((item) => String(item.id) === customerId);
  const accountOptions = workspace.accounts.filter((account) => ['sales', 'accounts_receivable', 'inventory', 'other_income'].includes(account.type));

  return (
    <div className="space-y-4">
      <TaskHeader activeTask="sales-orders" onBack={onBack} rightStatus={status} />
      <div className="flex flex-wrap gap-2">
        <ToolbarButton label="+ New" />
        <ToolbarButton label="List" />
        <ToolbarButton label="Save" />
        <ToolbarButton label="Save & New" />
        <ToolbarButton label="Bulk Upload" />
      </div>

      <Panel title="Sales Order Form">
        <div className="grid gap-4 xl:grid-cols-[1.1fr,1.1fr,1fr]">
          <Field label="Customer" required>
            <SelectInput value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="One Time Customer Name">
            <TextInput placeholder="Optional walk-in customer name" />
          </Field>
          <Field label="Date" required>
            <TextInput type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
          </Field>
          <Field label="Customer PO">
            <TextInput placeholder="Customer reference" />
          </Field>
          <Field label="Transaction Type">
            <SelectInput value={transactionType} onChange={(event) => setTransactionType(event.target.value)}>
              <option>Goods</option>
              <option>Service</option>
              <option>Mixed</option>
            </SelectInput>
          </Field>
          <Field label="SO No" required>
            <TextInput value={reference} onChange={(event) => setReference(event.target.value)} />
          </Field>
          <Field label="Transaction Origin">
            <SelectInput value={origin} onChange={(event) => setOrigin(event.target.value)}>
              <option>Local</option>
              <option>Export</option>
            </SelectInput>
          </Field>
          <Field label="Ship Via">
            <SelectInput value={shipBy} onChange={(event) => setShipBy(event.target.value)}>
              <option>Truck</option>
              <option>Pickup</option>
              <option>Courier</option>
            </SelectInput>
          </Field>
          <Field label="Ship By Date">
            <TextInput type="date" />
          </Field>
        </div>

        <div className="mt-5">
          <DocumentTable lines={lines} setLines={setLines} inventories={inventories} accountOptions={accountOptions} currency={workspace.company.baseCurrency} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr,320px]">
          <Panel title="Commercial Notes">
            <div className="space-y-3 text-[13px] text-[#52635d]">
              <p>Sales orders are handled here as pro-forma workflow documents in the Peachtree style. They prepare quantities, selling price, AR account, and stock issue expectations before the invoice is posted.</p>
              <p>This document does not post ledger lines until it becomes a sales invoice or receipt transaction.</p>
              <p>Customer selected: <span className="font-medium text-[#172126]">{customer?.name ?? 'Not selected'}</span></p>
            </div>
          </Panel>
          <div className="space-y-3">
            <AmountBox label="Subtotal" value={formatMoney(subtotal, workspace.company.baseCurrency)} />
            <AmountBox label="Tax" value={formatMoney(tax, workspace.company.baseCurrency)} />
            <AmountBox label="Pro Forma Total" value={formatMoney(total, workspace.company.baseCurrency)} />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button className="fin-action-btn-accent inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold" type="button" onClick={() => setStatus('Saved')}>
            <Save size={15} />
            Save Sales Order
          </button>
        </div>
      </Panel>
    </div>
  );
}

function PostingDocumentTask({
  taskKey,
  workspace,
  setWorkspace,
  customers,
  vendors,
  inventories,
  onBack,
}: Omit<TaskWorkspaceProps, 'companies' | 'activeTask'> & { taskKey: Extract<TaskKey, 'sales-invoices' | 'receipts' | 'credit-memos' | 'purchase-orders' | 'purchases-receive-inventories' | 'payments' | 'vendor-credit-memos' | 'inventory-adjustments' | 'deposits' | 'store-issue-vouchers'> }) {
  const [status, setStatus] = useState('Draft');
  const [documentDate, setDocumentDate] = useState('2026-04-03');
  const [partyId, setPartyId] = useState(String(customers[0]?.id ?? vendors[0]?.id ?? ''));
  const [memo, setMemo] = useState(taskLabel(taskKey));
  const [reference, setReference] = useState(`${taskKey.slice(0, 3).toUpperCase()}-${String(workspace.entries.length + 1).padStart(6, '0')}`);
  const [cashAccountId, setCashAccountId] = useState(findAccountByType(workspace, 'bank')?.id ?? findAccountByType(workspace, 'cash')?.id ?? '');
  const [offsetAccountId, setOffsetAccountId] = useState('');
  const [lines, setLines] = useState<DocumentLine[]>([{ ...createLine(), accountId: '' }]);
  const isCustomerFlow = ['sales-invoices', 'receipts', 'credit-memos'].includes(taskKey);
  const isReceipt = taskKey === 'receipts' || taskKey === 'deposits';
  const isDeposit = taskKey === 'deposits';
  const isPayment = taskKey === 'payments';
  const isPurchaseReceive = taskKey === 'purchases-receive-inventories';
  const isVendorCredit = taskKey === 'vendor-credit-memos';
  const isInventoryAdjust = taskKey === 'inventory-adjustments' || taskKey === 'store-issue-vouchers';
  const isSalesInvoice = taskKey === 'sales-invoices';
  const isProForma = taskKey === 'purchase-orders';

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const accountOptions = workspace.accounts.filter((account) => {
    if (isCustomerFlow) return ['sales', 'accounts_receivable', 'bank', 'cash', 'other_income'].includes(account.type);
    if (isPayment || isVendorCredit || isPurchaseReceive) return ['accounts_payable', 'inventory', 'bank', 'cash', 'operating_expense', 'cost_of_sales'].includes(account.type);
    if (isInventoryAdjust) return ['inventory', 'cost_of_sales', 'operating_expense'].includes(account.type);
    return true;
  });

  const impactText = isReceipt
    ? 'Receipt posts debit to bank/cash and credit to receivable or income.'
    : isPayment
      ? 'Payment posts debit to payable or expense and credit to bank/cash.'
      : isSalesInvoice
        ? 'Sales invoice posts debit to accounts receivable and credit to sales.'
        : isPurchaseReceive
          ? 'Purchase receipt posts debit to inventory and credit to accounts payable or cash.'
          : isVendorCredit
            ? 'Vendor credit memo posts debit to accounts payable and credit to inventory or expense.'
            : isInventoryAdjust
              ? 'Inventory adjustment posts between inventory and adjustment expense/cost accounts.'
              : 'Posting document updates the general ledger when saved.';

  const postDocument = () => {
    if (isProForma) {
      setStatus('Saved');
      return;
    }

    const totalAmount = Math.max(total, 0);
    const ar = findAccountByType(workspace, 'accounts_receivable');
    const ap = findAccountByType(workspace, 'accounts_payable');
    const bank = workspace.accounts.find((account) => account.id === cashAccountId) ?? findAccountByType(workspace, 'bank') ?? findAccountByType(workspace, 'cash');
    const inventory = findAccountByType(workspace, 'inventory');
    const selectedSalesLine = lines.find((line) => line.accountId);
    const sales = selectedSalesLine?.accountId ? workspace.accounts.find((account) => account.id === selectedSalesLine.accountId) : findAccountByType(workspace, 'sales');
    const expense = workspace.accounts.find((account) => account.id === offsetAccountId) ?? findAccountByType(workspace, 'cost_of_sales') ?? findAccountByType(workspace, 'operating_expense');

    let entry: JournalEntry | null = null;

    if (isSalesInvoice && ar && sales) {
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: [
          { accountId: ar.id, debit: totalAmount, credit: 0, memo: 'Sales invoice debit to receivable' },
          { accountId: sales.id, debit: 0, credit: totalAmount, memo: 'Sales invoice credit to revenue' },
        ],
      };
    } else if (isReceipt && bank && (ar || sales)) {
      const creditAccount = workspace.accounts.find((account) => account.id === offsetAccountId) ?? ar ?? sales!;
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: [
          { accountId: bank.id, debit: totalAmount, credit: 0, memo: 'Debit receipt into cash/bank' },
          { accountId: creditAccount.id, debit: 0, credit: totalAmount, memo: 'Credit customer receivable or income' },
        ],
      };
    } else if (taskKey === 'credit-memos' && ar && sales) {
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: [
          { accountId: sales.id, debit: totalAmount, credit: 0, memo: 'Debit sales for customer credit memo' },
          { accountId: ar.id, debit: 0, credit: totalAmount, memo: 'Credit receivable to reduce customer balance' },
        ],
      };
    } else if (isPurchaseReceive && inventory && (ap || bank)) {
      const creditAccount = workspace.accounts.find((account) => account.id === offsetAccountId) ?? ap ?? bank!;
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: [
          { accountId: inventory.id, debit: totalAmount, credit: 0, memo: 'Debit inventory received' },
          { accountId: creditAccount.id, debit: 0, credit: totalAmount, memo: 'Credit payable or bank' },
        ],
      };
    } else if (isPayment && bank && (ap || expense)) {
      const debitAccount = workspace.accounts.find((account) => account.id === offsetAccountId) ?? ap ?? expense!;
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: [
          { accountId: debitAccount.id, debit: totalAmount, credit: 0, memo: 'Debit payable or expense' },
          { accountId: bank.id, debit: 0, credit: totalAmount, memo: 'Credit bank or cash for payment' },
        ],
      };
    } else if (isVendorCredit && ap && (inventory || expense)) {
      const creditAccount = workspace.accounts.find((account) => account.id === offsetAccountId) ?? inventory ?? expense!;
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: [
          { accountId: ap.id, debit: totalAmount, credit: 0, memo: 'Debit accounts payable for vendor credit' },
          { accountId: creditAccount.id, debit: 0, credit: totalAmount, memo: 'Credit inventory or expense' },
        ],
      };
    } else if (isInventoryAdjust && inventory && expense) {
      const increasing = subtotal >= 0;
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: increasing
          ? [
              { accountId: inventory.id, debit: totalAmount, credit: 0, memo: 'Increase inventory balance' },
              { accountId: expense.id, debit: 0, credit: totalAmount, memo: 'Credit adjustment offset' },
            ]
          : [
              { accountId: expense.id, debit: totalAmount, credit: 0, memo: 'Debit adjustment offset' },
              { accountId: inventory.id, debit: 0, credit: totalAmount, memo: 'Decrease inventory balance' },
            ],
      };
    } else if (taskKey === 'deposits' && bank) {
      const cash = findAccountByType(workspace, 'cash') ?? bank;
      entry = {
        id: crypto.randomUUID(),
        date: documentDate,
        reference,
        memo,
        source: 'manual',
        lines: [
          { accountId: bank.id, debit: totalAmount, credit: 0, memo: 'Deposit to bank' },
          { accountId: cash.id, debit: 0, credit: totalAmount, memo: 'Clear cash on hand' },
        ],
      };
    }

    if (entry) {
      appendEntry(setWorkspace, entry);
      setStatus('Posted');
    }
  };

  const primaryPartyList = isCustomerFlow ? customers : vendors;

  return (
    <div className="space-y-4">
      <TaskHeader activeTask={taskKey} onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[1fr,330px]">
        <Panel title={`${taskLabel(taskKey)} Entry`}>
          <div className="grid gap-4 xl:grid-cols-3">
            <Field label={isCustomerFlow ? 'Customer' : 'Vendor'} required>
              <SelectInput value={partyId} onChange={(event) => setPartyId(event.target.value)}>
                {primaryPartyList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Date" required>
              <TextInput type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} />
            </Field>
            <Field label="Reference No" required>
              <TextInput value={reference} onChange={(event) => setReference(event.target.value)} />
            </Field>
            <Field label={isReceipt || isPayment || isDeposit ? 'Cash / Bank Account' : 'Offset Account'}>
              <SelectInput value={isReceipt || isPayment || isDeposit ? cashAccountId : offsetAccountId} onChange={(event) => (isReceipt || isPayment || isDeposit ? setCashAccountId(event.target.value) : setOffsetAccountId(event.target.value))}>
                <option value="">Select account</option>
                {workspace.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {(isReceipt || isPayment || isSalesInvoice || isPurchaseReceive || isVendorCredit) && (
              <Field label={isReceipt ? 'Credit Account' : 'Debit / Credit Offset'}>
                <SelectInput value={offsetAccountId} onChange={(event) => setOffsetAccountId(event.target.value)}>
                  <option value="">System default</option>
                  {workspace.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            )}
            <Field label="Memo">
              <TextInput value={memo} onChange={(event) => setMemo(event.target.value)} />
            </Field>
          </div>

          <div className="mt-5">
            <DocumentTable lines={lines} setLines={setLines} inventories={inventories} accountOptions={accountOptions} currency={workspace.company.baseCurrency} />
          </div>

          <div className="mt-5 flex justify-end">
            <button className="fin-action-btn-accent inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold" type="button" onClick={postDocument}>
              <Save size={15} />
              {isProForma ? 'Save Form' : 'Post Document'}
            </button>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Posting Logic">
            <div className="space-y-3 text-[13px] text-[#52635d]">
              <p>{impactText}</p>
              {isReceipt && <AmountBox label="Debit Side" value="Cash / Bank" tone="debit" />}
              {isReceipt && <AmountBox label="Credit Side" value="Accounts Receivable / Income" tone="credit" />}
              {isPayment && <AmountBox label="Debit Side" value="Accounts Payable / Expense" tone="debit" />}
              {isPayment && <AmountBox label="Credit Side" value="Cash / Bank" tone="credit" />}
            </div>
          </Panel>
          <AmountBox label="Subtotal" value={formatMoney(subtotal, workspace.company.baseCurrency)} />
          <AmountBox label="Tax" value={formatMoney(tax, workspace.company.baseCurrency)} />
          <AmountBox label="Total" value={formatMoney(total, workspace.company.baseCurrency)} />
        </div>
      </div>
    </div>
  );
}

function GeneralJournalTask({ workspace, setWorkspace, onBack }: { workspace: FinanceWorkspaceState; setWorkspace: React.Dispatch<React.SetStateAction<FinanceWorkspaceState>>; onBack: () => void }) {
  const [status, setStatus] = useState('Draft');
  const [date, setDate] = useState('2026-04-03');
  const [reference, setReference] = useState(`GJ-${String(workspace.entries.length + 1).padStart(6, '0')}`);
  const [memo, setMemo] = useState('Manual adjustment');
  const [lines, setLines] = useState([
    { id: crypto.randomUUID(), accountId: findAccountByType(workspace, 'operating_expense')?.id ?? '', debit: 0, credit: 0, memo: '' },
    { id: crypto.randomUUID(), accountId: findAccountByType(workspace, 'bank')?.id ?? '', debit: 0, credit: 0, memo: '' },
  ]);

  const debitTotal = lines.reduce((sum, line) => sum + line.debit, 0);
  const creditTotal = lines.reduce((sum, line) => sum + line.credit, 0);
  const balanced = debitTotal === creditTotal && debitTotal > 0;

  const updateLine = (lineId: string, patch: Partial<(typeof lines)[number]>) => {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  };

  const saveJournal = () => {
    if (!balanced) return;
    appendEntry(setWorkspace, {
      id: crypto.randomUUID(),
      date,
      reference,
      memo,
      source: 'manual',
      lines: lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        memo: line.memo,
      })),
    });
    setStatus('Posted');
  };

  return (
    <div className="space-y-4">
      <TaskHeader activeTask="general-journal-entries" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[1fr,320px]">
        <Panel title="Journal Header">
          <div className="grid gap-4 xl:grid-cols-3">
            <Field label="Date" required>
              <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
            <Field label="Reference" required>
              <TextInput value={reference} onChange={(event) => setReference(event.target.value)} />
            </Field>
            <Field label="Memo">
              <TextInput value={memo} onChange={(event) => setMemo(event.target.value)} />
            </Field>
          </div>
          <div className="mt-5 overflow-hidden rounded-[24px] border border-[#dbe5df] bg-white/70">
            <table className="fin-table min-w-full text-[12px]">
              <thead className="fin-panel-header fin-table-head text-left">
                <tr>
                  <th className="px-3 py-3 font-medium">Account</th>
                  <th className="px-3 py-3 font-medium">Memo</th>
                  <th className="px-3 py-3 font-medium">Debit</th>
                  <th className="px-3 py-3 font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="fin-table-row">
                    <td className="px-3 py-2">
                      <SelectInput value={line.accountId} onChange={(event) => updateLine(line.id, { accountId: event.target.value })}>
                        {workspace.accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </SelectInput>
                    </td>
                    <td className="px-3 py-2">
                      <TextInput value={line.memo} onChange={(event) => updateLine(line.id, { memo: event.target.value })} />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput type="number" min="0" step="0.01" value={line.debit} onChange={(event) => updateLine(line.id, { debit: Number(event.target.value) || 0, credit: 0 })} />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput type="number" min="0" step="0.01" value={line.credit} onChange={(event) => updateLine(line.id, { credit: Number(event.target.value) || 0, debit: 0 })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-[#dbe5df] p-3">
              <button className="fin-action-btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium" onClick={() => setLines((current) => [...current, { id: crypto.randomUUID(), accountId: workspace.accounts[0]?.id ?? '', debit: 0, credit: 0, memo: '' }])} type="button">
                <Plus size={14} />
                Add Line
              </button>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button className="fin-action-btn-accent inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold" onClick={saveJournal} type="button">
              <Save size={15} />
              Post Journal
            </button>
          </div>
        </Panel>
        <div className="space-y-4">
          <AmountBox label="Total Debits" value={formatMoney(debitTotal, workspace.company.baseCurrency)} tone="debit" />
          <AmountBox label="Total Credits" value={formatMoney(creditTotal, workspace.company.baseCurrency)} tone="credit" />
          <Panel title="Journal Rule">
            <p className="text-[13px] text-[#52635d]">Peachtree-style journal entry requires debits and credits to balance before posting. Current status: <span className="font-medium text-[#172126]">{balanced ? 'Balanced' : 'Not balanced'}</span>.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function RegisterTask({ workspace, onBack }: { workspace: FinanceWorkspaceState; onBack: () => void }) {
  const [accountId, setAccountId] = useState(workspace.accounts[0]?.id ?? '');
  const rows = useMemo(() => buildLedgerForAccount(workspace, accountId), [workspace, accountId]);
  const account = workspace.accounts.find((item) => item.id === accountId);

  return (
    <div className="space-y-4">
      <TaskHeader activeTask="account-register" onBack={onBack} rightStatus="Live Ledger" />
      <div className="grid gap-4 xl:grid-cols-[320px,1fr]">
        <Panel title="Account Selector">
          <Field label="Ledger Account">
            <SelectInput value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              {workspace.accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="mt-4">
            <AmountBox label="Current Balance" value={formatMoney(account ? calculateSignedBalance(account, workspace.entries) : 0, workspace.company.baseCurrency)} />
          </div>
        </Panel>
        <Panel title="Ledger Activity">
          <table className="fin-table min-w-full text-[12px]">
            <thead className="fin-table-head text-left">
              <tr><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Reference</th><th className="pb-2 font-medium">Memo</th><th className="pb-2 font-medium">Debit</th><th className="pb-2 font-medium">Credit</th><th className="pb-2 font-medium">Running Balance</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.entryId}-${row.reference}`} className="fin-table-row">
                  <td className="py-2">{row.date}</td>
                  <td className="py-2">{row.reference}</td>
                  <td className="py-2">{row.memo}</td>
                  <td className="py-2">{formatMoney(row.debit, workspace.company.baseCurrency)}</td>
                  <td className="py-2">{formatMoney(row.credit, workspace.company.baseCurrency)}</td>
                  <td className="py-2">{formatMoney(row.runningBalance, workspace.company.baseCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

function ReconciliationTask({ workspace, onBack }: { workspace: FinanceWorkspaceState; onBack: () => void }) {
  const bankAccounts = workspace.accounts.filter((account) => account.type === 'bank' || account.type === 'cash');
  return (
    <div className="space-y-4">
      <TaskHeader activeTask="account-reconciliation" onBack={onBack} rightStatus="Review" />
      <Panel title="Bank and Cash Reconciliation">
        <table className="fin-table min-w-full text-[12px]">
          <thead className="fin-table-head text-left">
            <tr><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium">Book Balance</th><th className="pb-2 font-medium">Statement Balance</th><th className="pb-2 font-medium">Variance</th></tr>
          </thead>
          <tbody>
            {bankAccounts.map((account) => {
              const book = calculateSignedBalance(account, workspace.entries);
              const statement = book - 120;
              return (
                <tr key={account.id} className="fin-table-row">
                  <td className="py-2">{account.code} - {account.name}</td>
                  <td className="py-2">{formatMoney(book, workspace.company.baseCurrency)}</td>
                  <td className="py-2">{formatMoney(statement, workspace.company.baseCurrency)}</td>
                  <td className="py-2">{formatMoney(book - statement, workspace.company.baseCurrency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function PendingTasksTask({ onBack }: { onBack: () => void }) {
  const pending = [
    '2 sales orders waiting for invoice conversion',
    '1 purchase order waiting for vendor delivery',
    '1 bank reconciliation variance to clear',
    '3 inventory issues pending approval',
  ];
  return (
    <div className="space-y-4">
      <TaskHeader activeTask="pending-tasks" onBack={onBack} rightStatus="Follow Up" />
      <Panel title="Pending Workflow Queue">
        <div className="space-y-3">
          {pending.map((item) => (
            <div key={item} className="rounded-2xl border border-[#dbe5df] bg-white/70 px-4 py-3 text-[13px] text-[#30423d]">{item}</div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AssetsTask({ workspace, onBack }: { workspace: FinanceWorkspaceState; onBack: () => void }) {
  const assets = workspace.accounts.filter((account) => account.category === 'asset');
  return (
    <div className="space-y-4">
      <TaskHeader activeTask="assets" onBack={onBack} rightStatus="Fixed Asset Review" />
      <Panel title="Asset Register">
        <table className="fin-table min-w-full text-[12px]">
          <thead className="fin-table-head text-left">
            <tr><th className="pb-2 font-medium">Code</th><th className="pb-2 font-medium">Asset</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">Balance</th></tr>
          </thead>
          <tbody>
            {assets.map((account) => (
              <tr key={account.id} className="fin-table-row">
                <td className="py-2">{account.code}</td>
                <td className="py-2">{account.name}</td>
                <td className="py-2">{account.type}</td>
                <td className="py-2">{formatMoney(calculateSignedBalance(account, workspace.entries), workspace.company.baseCurrency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function TaskWorkspace(props: TaskWorkspaceProps) {
  const { activeTask, workspace, setWorkspace, customers, vendors, inventories, companies, onBack } = props;
  void companies;

  switch (activeTask) {
    case 'sales-orders':
      return <SalesOrderTask workspace={workspace} customers={customers} inventories={inventories} onBack={onBack} />;
    case 'sales-invoices':
    case 'receipts':
    case 'credit-memos':
    case 'purchase-orders':
    case 'purchases-receive-inventories':
    case 'payments':
    case 'vendor-credit-memos':
    case 'inventory-adjustments':
    case 'deposits':
    case 'store-issue-vouchers':
      return (
        <PostingDocumentTask
          taskKey={activeTask}
          workspace={workspace}
          setWorkspace={setWorkspace}
          customers={customers}
          vendors={vendors}
          inventories={inventories}
          onBack={onBack}
        />
      );
    case 'general-journal-entries':
      return <GeneralJournalTask workspace={workspace} setWorkspace={setWorkspace} onBack={onBack} />;
    case 'account-register':
      return <RegisterTask workspace={workspace} onBack={onBack} />;
    case 'account-reconciliation':
      return <ReconciliationTask workspace={workspace} onBack={onBack} />;
    case 'pending-tasks':
      return <PendingTasksTask onBack={onBack} />;
    case 'assets':
      return <AssetsTask workspace={workspace} onBack={onBack} />;
    default:
      return <PendingTasksTask onBack={onBack} />;
  }
}
