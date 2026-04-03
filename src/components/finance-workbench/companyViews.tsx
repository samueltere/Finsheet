import React from 'react';
import { FinanceWorkspaceState } from '../../finance/types';
import { formatMoney } from '../../finance/engine';
import { Panel, ViewLink, MiniPie } from './shared';
import { VendorRow } from './data';

export function CompanyInfoView({ workspace }: { workspace: FinanceWorkspaceState }) {
  const companyInfoRows = [
    ['Name', workspace.company.name],
    ['Telephone', '097867576656'],
    ['Business Type', 'PLC'],
    ['Industry Line', 'Construction'],
    ['TIN', '0908987865'],
    ['Posting Method', 'Realtime'],
    ['Accounting Method', 'Accrual'],
    ['Start Date', '07/08/2018'],
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr,1fr,1fr]">
      <div className="space-y-4">
        <Panel title="Company Tasks">
          <div className="grid grid-cols-2 gap-2">
            <button className="fin-action-btn rounded-2xl px-3 py-2 text-[12px] font-medium">Users</button>
            <button className="fin-action-btn rounded-2xl px-3 py-2 text-[12px] font-medium">Chart of Accounts</button>
          </div>
          <div className="mt-3 border-t border-[#e1e9e4] pt-3 text-[12px]">
            <button className="fin-link font-medium hover:underline">General Journal Entry</button>
            <p className="fin-muted mt-2">Create journal entries for things like beginning balances, depreciation, and balance transfers.</p>
          </div>
        </Panel>

        <Panel title="Company Information" action={<button className="fin-link text-[12px] font-medium hover:underline">Edit company information</button>}>
          <table className="fin-table min-w-full text-[12px]">
            <tbody>
              {companyInfoRows.map(([label, value]) => (
                <tr key={label} className="fin-table-row last:border-b-0">
                  <td className="fin-table-soft w-[48%] px-2 py-2 text-[#455450]">{label}</td>
                  <td className="px-2 py-2 text-[#172126]">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Financial Statements">
        <div className="space-y-3 text-[12px]">
          <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Cash flow</span><ViewLink /></div>
          <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Income statement</span><ViewLink /></div>
          <div className="flex items-center justify-between"><span>Balance sheet</span><ViewLink /></div>
        </div>
      </Panel>

      <Panel title="Company Report">
        <div className="space-y-3 text-[12px]">
          <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Find transaction report</span><ViewLink /></div>
          <div className="flex items-center justify-between"><span>General ledger</span><ViewLink /></div>
        </div>
      </Panel>
    </div>
  );
}

export function BusinessStatusView({
  workspace,
  vendors,
  summary,
}: {
  workspace: FinanceWorkspaceState;
  vendors: VendorRow[];
  summary: ReturnType<typeof import('../../finance/engine').calculateAccountingSummary>;
}) {
  return (
    <div className="space-y-4">
      <Panel title="Revenue: Year to Date" action={<div className="fin-pill rounded-xl px-3 py-1 text-[12px]">2018</div>}>
        <div className="grid gap-6 xl:grid-cols-[1fr,240px]">
          <div>
            <div className="mb-4 flex gap-6 text-[11px] text-[#68756f]">
              <span className="text-[#1fa37a]">Revenue</span>
              <span className="text-[#5b8fc2]">Cost of sales</span>
              <span className="text-[#c86d4b]">Expenses</span>
              <span className="text-[#3f5f58]">Gross Profit</span>
              <span className="text-[#a65b3d]">Net Income</span>
            </div>
            <div className="relative h-[120px] overflow-hidden rounded-2xl border border-[#e1e9e4] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(243,248,244,0.82))]">
              <div className="absolute inset-x-3 bottom-8 h-[2px] bg-[#c86d4b]" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-8 pb-4 text-[10px] text-[#93a39d]">
                {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => <span key={month}>{month}</span>)}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 text-center text-[11px] text-[#187a5d]">
              <button className="hover:underline">View Income Statement</button>
              <button className="hover:underline">View Account Variance</button>
              <button className="hover:underline">Setup Budget</button>
            </div>
          </div>

          <div className="space-y-5 border-l border-[#e1e9e4] pl-6 text-[11px]">
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-[#1fa37a]">Total Revenue</span><span>{formatMoney(0, workspace.company.baseCurrency)}</span></div>
              <div className="flex justify-between"><span>Cost of Sales</span><span>{formatMoney(0, workspace.company.baseCurrency)}</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Gross Profit</span><span>{formatMoney(summary.netProfit + 1200, workspace.company.baseCurrency)}</span></div>
              <div className="flex justify-between"><span>Expenses</span><span>{formatMoney(summary.totals.expense, workspace.company.baseCurrency)}</span></div>
              <div className="flex justify-between"><span className="text-[#a65b3d]">Net Income</span><span>{formatMoney(summary.netProfit, workspace.company.baseCurrency)}</span></div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Vendors to Pay">
          <table className="fin-table min-w-full text-[12px]">
            <thead className="fin-table-head text-left">
              <tr><th className="pb-2 font-medium">Vendor Id</th><th className="pb-2 font-medium">Vendor Name</th><th className="pb-2 font-medium">Amount Due</th><th className="pb-2 font-medium">Due Date</th></tr>
            </thead>
            <tbody>
              {vendors.slice(0, 2).map((vendor) => (
                <tr key={vendor.id} className="fin-table-row">
                  <td className="py-2">{vendor.id}</td>
                  <td className="py-2">{vendor.name}</td>
                  <td className={`py-2 ${vendor.balance < 0 ? 'fin-danger' : 'text-[#172126]'}`}>{formatMoney(vendor.balance, workspace.company.baseCurrency)}</td>
                  <td className="py-2">{vendor.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Customer who owes money">
          <div className="py-10 text-center text-[12px] text-[#b1bac7]">No data</div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Aged Payable">
          <div className="grid gap-6 xl:grid-cols-[240px,1fr]">
            <MiniPie />
            <table className="fin-table min-w-full text-[12px]">
              <thead className="fin-table-head text-left">
                <tr><th className="pb-2 font-medium">Days Overdue</th><th className="pb-2 font-medium">Amount</th><th className="pb-2 font-medium">Percent</th></tr>
              </thead>
              <tbody>
                {[
                  ['0-30', 0, '0.00%'],
                  ['31-60', 0, '0.00%'],
                  ['61-90', 0, '0.00%'],
                  ['Over 90', -155300, '100.00%'],
                  ['Total', -155300, ''],
                ].map(([label, amount, percent]) => (
                  <tr key={String(label)} className="fin-table-row">
                    <td className="py-2">{label}</td>
                    <td className="py-2">{formatMoney(Number(amount), workspace.company.baseCurrency)}</td>
                    <td className="py-2">{percent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Aged Receivable">
          <table className="fin-table min-w-full text-[12px]">
            <thead className="fin-table-head text-left">
              <tr><th className="pb-2 font-medium">Days Overdue</th><th className="pb-2 font-medium">Amount</th><th className="pb-2 font-medium">Percent</th></tr>
            </thead>
            <tbody>
              {[
                ['0-30', 0, '0%'],
                ['31-60', 0, '0%'],
                ['61-90', 0, '0%'],
                ['Over 90', 0, '0%'],
                ['Total', 0, '0%'],
              ].map(([label, amount, percent]) => (
                  <tr key={String(label)} className="fin-table-row">
                    <td className="py-2">{label}</td>
                    <td className="py-2">{formatMoney(Number(amount), workspace.company.baseCurrency)}</td>
                    <td className="py-2">{percent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
