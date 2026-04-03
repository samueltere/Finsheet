import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Save } from 'lucide-react';
import type { FinanceAccount, FinanceWorkspaceState } from '../../finance/types';
import { BudgetRow, budgetsSeed, CustomerRow, EmployeeRow, employeesSeed, InventoryRow, MaintainKey, maintainMenuItems, ProjectRow, projectsSeed, TaxRow, taxesSeed, VendorRow } from './data';
import { Panel } from './shared';

type MaintainWorkspaceProps = {
  activeMaintain: MaintainKey;
  workspace: FinanceWorkspaceState;
  setWorkspace: React.Dispatch<React.SetStateAction<FinanceWorkspaceState>>;
  customers: CustomerRow[];
  setCustomers: React.Dispatch<React.SetStateAction<CustomerRow[]>>;
  vendors: VendorRow[];
  setVendors: React.Dispatch<React.SetStateAction<VendorRow[]>>;
  inventories: InventoryRow[];
  setInventories: React.Dispatch<React.SetStateAction<InventoryRow[]>>;
  onBack: () => void;
};

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

function MaintainHeader({ activeMaintain, onBack, rightStatus }: { activeMaintain: MaintainKey; onBack: () => void; rightStatus: string }) {
  const meta = maintainMenuItems.find((item) => item.key === activeMaintain)!;
  return (
    <div className="mb-5 flex items-start justify-between gap-4 rounded-[24px] border border-[#dbe5df] bg-white/65 px-5 py-4">
      <div className="space-y-2">
        <button className="fin-link inline-flex items-center gap-2 text-[12px] font-medium hover:underline" onClick={onBack}>
          <ArrowLeft size={14} />
          Back to workspace
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#71857e]">Maintain</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#172126]">{meta.label}</h2>
          <p className="mt-1 max-w-3xl text-[13px] text-[#5c6c67]">{meta.description}</p>
        </div>
      </div>
      <div className="fin-status-pill rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">{rightStatus}</div>
    </div>
  );
}

function SaveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="fin-action-btn-accent inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold" type="button" onClick={onClick}>
      <Save size={15} />
      {label}
    </button>
  );
}

function ListingTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#dbe5df] bg-white/72">
      <table className="fin-table min-w-full text-[12px]">
        <thead className="fin-panel-header fin-table-head text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="fin-table-row">
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="px-3 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerMaintain({ customers, setCustomers, onBack }: Pick<MaintainWorkspaceProps, 'customers' | 'setCustomers' | 'onBack'>) {
  const [form, setForm] = useState({ name: '', phone: '', balance: '0' });
  const [status, setStatus] = useState('Create');
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="customers" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Customer">
          <div className="space-y-4">
            <Field label="Customer Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Opening Balance"><TextInput type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></Field>
            <div className="flex justify-end">
              <SaveButton label="Create Customer" onClick={() => {
                if (!form.name.trim()) return;
                setCustomers((current) => [...current, { id: current.length + 1, name: form.name, phone: form.phone, balance: Number(form.balance) || 0 }]);
                setForm({ name: '', phone: '', balance: '0' });
                setStatus('Saved');
              }} />
            </div>
          </div>
        </Panel>
        <Panel title="Customer Master List">
          <ListingTable headers={['ID', 'Name', 'Phone', 'Balance']} rows={customers.map((item) => [item.id, item.name, item.phone || '-', item.balance])} />
        </Panel>
      </div>
    </div>
  );
}

function VendorMaintain({ vendors, setVendors, onBack }: Pick<MaintainWorkspaceProps, 'vendors' | 'setVendors' | 'onBack'>) {
  const [form, setForm] = useState({ name: '', phone: '', balance: '0', dueDate: '2026-04-30' });
  const [status, setStatus] = useState('Create');
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="vendors" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Vendor">
          <div className="space-y-4">
            <Field label="Vendor Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Opening Balance"><TextInput type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></Field>
            <Field label="Due Date"><TextInput type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
            <div className="flex justify-end">
              <SaveButton label="Create Vendor" onClick={() => {
                if (!form.name.trim()) return;
                setVendors((current) => [...current, { id: current.length + 1, name: form.name, phone: form.phone, balance: Number(form.balance) || 0, dueDate: form.dueDate }]);
                setForm({ name: '', phone: '', balance: '0', dueDate: '2026-04-30' });
                setStatus('Saved');
              }} />
            </div>
          </div>
        </Panel>
        <Panel title="Vendor Master List">
          <ListingTable headers={['ID', 'Name', 'Phone', 'Balance', 'Due Date']} rows={vendors.map((item) => [item.id, item.name, item.phone || '-', item.balance, item.dueDate])} />
        </Panel>
      </div>
    </div>
  );
}

function InventoryMaintain({ inventories, setInventories, onBack }: Pick<MaintainWorkspaceProps, 'inventories' | 'setInventories' | 'onBack'>) {
  const [form, setForm] = useState({ itemName: '', itemClass: 'Stock Item' });
  const [status, setStatus] = useState('Create');
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="inventory-items" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Inventory Item">
          <div className="space-y-4">
            <Field label="Item Name" required><TextInput value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></Field>
            <Field label="Item Class">
              <SelectInput value={form.itemClass} onChange={(e) => setForm({ ...form, itemClass: e.target.value })}>
                <option>Stock Item</option>
                <option>Service Item</option>
                <option>Assembly Item</option>
              </SelectInput>
            </Field>
            <div className="flex justify-end">
              <SaveButton label="Create Item" onClick={() => {
                if (!form.itemName.trim()) return;
                setInventories((current) => [...current, { id: current.length + 1, itemId: current.length + 1, itemName: form.itemName, itemClass: form.itemClass }]);
                setForm({ itemName: '', itemClass: 'Stock Item' });
                setStatus('Saved');
              }} />
            </div>
          </div>
        </Panel>
        <Panel title="Inventory Master List">
          <ListingTable headers={['ID', 'Item ID', 'Name', 'Class']} rows={inventories.map((item) => [item.id, item.itemId, item.itemName, item.itemClass])} />
        </Panel>
      </div>
    </div>
  );
}

function ChartOfAccountsMaintain({ workspace, setWorkspace, onBack }: Pick<MaintainWorkspaceProps, 'workspace' | 'setWorkspace' | 'onBack'>) {
  const [form, setForm] = useState({ code: '', name: '', category: 'asset' as FinanceAccount['category'], type: 'other_asset' as FinanceAccount['type'] });
  const [status, setStatus] = useState('Create');
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="chart-of-accounts" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Account">
          <div className="space-y-4">
            <Field label="Account Code" required><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label="Account Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Category">
              <SelectInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FinanceAccount['category'] })}>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </SelectInput>
            </Field>
            <Field label="Type">
              <SelectInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FinanceAccount['type'] })}>
                <option value="other_asset">Other Asset</option>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
                <option value="accounts_receivable">Accounts Receivable</option>
                <option value="inventory">Inventory</option>
                <option value="accounts_payable">Accounts Payable</option>
                <option value="tax_payable">Tax Payable</option>
                <option value="loan">Loan</option>
                <option value="capital">Capital</option>
                <option value="retained_earnings">Retained Earnings</option>
                <option value="sales">Sales</option>
                <option value="other_income">Other Income</option>
                <option value="cost_of_sales">Cost of Sales</option>
                <option value="operating_expense">Operating Expense</option>
              </SelectInput>
            </Field>
            <div className="flex justify-end">
              <SaveButton label="Create Account" onClick={() => {
                if (!form.code.trim() || !form.name.trim()) return;
                setWorkspace((current) => ({
                  ...current,
                  accounts: [...current.accounts, { id: `acct-${form.code}`, code: form.code, name: form.name, category: form.category, type: form.type, cashFlowGroup: form.category === 'equity' ? 'financing' : form.category === 'asset' ? 'investing' : 'operating', isSystem: false }],
                }));
                setForm({ code: '', name: '', category: 'asset', type: 'other_asset' });
                setStatus('Saved');
              }} />
            </div>
          </div>
        </Panel>
        <Panel title="Chart of Accounts">
          <ListingTable headers={['Code', 'Name', 'Category', 'Type']} rows={workspace.accounts.map((account) => [account.code, account.name, account.category, account.type])} />
        </Panel>
      </div>
    </div>
  );
}

function EmployeesMaintain({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<EmployeeRow[]>(employeesSeed);
  const [form, setForm] = useState({ fullName: '', department: '', phone: '' });
  const [status, setStatus] = useState('Create');
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="employees" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Employee">
          <div className="space-y-4">
            <Field label="Full Name" required><TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
            <Field label="Department"><TextInput value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
            <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <div className="flex justify-end"><SaveButton label="Create Employee" onClick={() => {
              if (!form.fullName.trim()) return;
              setRows((current) => [...current, { id: `emp-${String(current.length + 1).padStart(3, '0')}`, ...form }]);
              setForm({ fullName: '', department: '', phone: '' });
              setStatus('Saved');
            }} /></div>
          </div>
        </Panel>
        <Panel title="Employees">
          <ListingTable headers={['ID', 'Name', 'Department', 'Phone']} rows={rows.map((row) => [row.id, row.fullName, row.department, row.phone])} />
        </Panel>
      </div>
    </div>
  );
}

function BudgetsMaintain({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<BudgetRow[]>(budgetsSeed);
  const [form, setForm] = useState({ name: '', amount: '0', year: '2026' });
  const [status, setStatus] = useState('Create');
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="budgets" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Budget">
          <div className="space-y-4">
            <Field label="Budget Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Amount"><TextInput type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="Year"><TextInput value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
            <div className="flex justify-end"><SaveButton label="Create Budget" onClick={() => {
              if (!form.name.trim()) return;
              setRows((current) => [...current, { id: `bud-${String(current.length + 1).padStart(3, '0')}`, name: form.name, amount: Number(form.amount) || 0, year: form.year }]);
              setForm({ name: '', amount: '0', year: '2026' });
              setStatus('Saved');
            }} /></div>
          </div>
        </Panel>
        <Panel title="Budgets">
          <ListingTable headers={['ID', 'Name', 'Amount', 'Year']} rows={rows.map((row) => [row.id, row.name, row.amount, row.year])} />
        </Panel>
      </div>
    </div>
  );
}

function ProjectsMaintain({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<ProjectRow[]>(projectsSeed);
  const [form, setForm] = useState({ name: '', status: 'Open' as ProjectRow['status'] });
  const [status, setStatus] = useState('Create');
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="projects-jobs" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Project / Job">
          <div className="space-y-4">
            <Field label="Project Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectRow['status'] })}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </SelectInput>
            </Field>
            <div className="flex justify-end"><SaveButton label="Create Project" onClick={() => {
              if (!form.name.trim()) return;
              setRows((current) => [...current, { id: `prj-${String(current.length + 1).padStart(3, '0')}`, name: form.name, status: form.status }]);
              setForm({ name: '', status: 'Open' });
              setStatus('Saved');
            }} /></div>
          </div>
        </Panel>
        <Panel title="Projects / Jobs">
          <ListingTable headers={['ID', 'Name', 'Status']} rows={rows.map((row) => [row.id, row.name, row.status])} />
        </Panel>
      </div>
    </div>
  );
}

function TaxesMaintain({ workspace, onBack }: Pick<MaintainWorkspaceProps, 'workspace' | 'onBack'>) {
  const [rows, setRows] = useState<TaxRow[]>(taxesSeed);
  const [form, setForm] = useState({ name: '', rate: '15', accountId: workspace.accounts.find((a) => a.type === 'tax_payable')?.id ?? workspace.accounts[0]?.id ?? '' });
  const [status, setStatus] = useState('Create');
  const taxAccounts = useMemo(() => workspace.accounts.filter((account) => account.category === 'liability' || account.category === 'revenue'), [workspace.accounts]);
  return (
    <div className="space-y-4">
      <MaintainHeader activeMaintain="taxes" onBack={onBack} rightStatus={status} />
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <Panel title="Create Tax Code">
          <div className="space-y-4">
            <Field label="Tax Name" required><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Rate %"><TextInput type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
            <Field label="Account">
              <SelectInput value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                {taxAccounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}
              </SelectInput>
            </Field>
            <div className="flex justify-end"><SaveButton label="Create Tax" onClick={() => {
              if (!form.name.trim()) return;
              setRows((current) => [...current, { id: `tax-${String(current.length + 1).padStart(3, '0')}`, name: form.name, rate: Number(form.rate) || 0, accountId: form.accountId }]);
              setForm({ name: '', rate: '15', accountId: form.accountId });
              setStatus('Saved');
            }} /></div>
          </div>
        </Panel>
        <Panel title="Tax Codes">
          <ListingTable headers={['ID', 'Name', 'Rate', 'Account']} rows={rows.map((row) => [row.id, row.name, `${row.rate}%`, workspace.accounts.find((a) => a.id === row.accountId)?.name ?? row.accountId])} />
        </Panel>
      </div>
    </div>
  );
}

export function MaintainWorkspace(props: MaintainWorkspaceProps) {
  const { activeMaintain, workspace, setWorkspace, customers, setCustomers, vendors, setVendors, inventories, setInventories, onBack } = props;

  switch (activeMaintain) {
    case 'customers':
      return <CustomerMaintain customers={customers} setCustomers={setCustomers} onBack={onBack} />;
    case 'vendors':
      return <VendorMaintain vendors={vendors} setVendors={setVendors} onBack={onBack} />;
    case 'inventory-items':
      return <InventoryMaintain inventories={inventories} setInventories={setInventories} onBack={onBack} />;
    case 'chart-of-accounts':
      return <ChartOfAccountsMaintain workspace={workspace} setWorkspace={setWorkspace} onBack={onBack} />;
    case 'employees':
      return <EmployeesMaintain onBack={onBack} />;
    case 'budgets':
      return <BudgetsMaintain onBack={onBack} />;
    case 'projects-jobs':
      return <ProjectsMaintain onBack={onBack} />;
    case 'taxes':
      return <TaxesMaintain workspace={workspace} onBack={onBack} />;
    default:
      return <CustomerMaintain customers={customers} setCustomers={setCustomers} onBack={onBack} />;
  }
}
