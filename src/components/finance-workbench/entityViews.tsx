import React from 'react';
import { FinanceWorkspaceState } from '../../finance/types';
import { formatMoney } from '../../finance/engine';
import { ChevronDown, Package, Search, Users } from 'lucide-react';
import { CompanyRow, CustomerRow, InventoryRow, VendorRow } from './data';
import { EntitySelectors, MiniPie, Panel, ViewLink } from './shared';

export function CustomersView({ customers, currency }: { customers: CustomerRow[]; currency: string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr,1.42fr]">
      <div className="space-y-4">
        <div className="border-b border-[#dbe5df] pb-3">
          <div className="mb-3 flex gap-6 text-[12px] font-medium">
            <button className="fin-tab-btn fin-tab-btn-active pb-2">Customer and Sales Tasks</button>
            <button className="fin-tab-btn pb-2">Customer Management</button>
          </div>
          <EntitySelectors customer />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Sales Order</button>
            <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Invoice</button>
            <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Receipt</button>
            <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Debit memo</button>
            <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Report</button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Panel title="Customers">
          <table className="fin-table min-w-full text-[12px]">
            <thead className="fin-table-head text-left">
              <tr><th className="pb-2 font-medium">No</th><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Telephone 1</th><th className="pb-2 font-medium text-right">Balance</th></tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="fin-table-row">
                  <td className="py-2">{customer.id}</td>
                  <td className="py-2">{customer.name}</td>
                  <td className="py-2">{customer.phone}</td>
                  <td className="py-2 text-right">{formatMoney(customer.balance, currency)}</td>
                </tr>
              ))}
              <tr className="fin-table-row font-medium">
                <td className="py-2" />
                <td className="py-2">Total</td>
                <td className="py-2" />
                <td className="py-2 text-right">{formatMoney(0, currency)}</td>
              </tr>
            </tbody>
          </table>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <Panel title="Customer Reports">
            <div className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Invoice register</span><ViewLink label="view" /></div>
              <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Sales order register</span><ViewLink label="view" /></div>
              <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Sales journal</span><ViewLink label="view" /></div>
              <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Sales order journal</span><ViewLink label="view" /></div>
              <button className="fin-link font-medium hover:underline">All Customer Reports</button>
            </div>
          </Panel>

          <Panel title="Aged Receivables">
            <MiniPie />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function VendorsView({ vendors, currency }: { vendors: VendorRow[]; currency: string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
      <div className="space-y-4">
        <EntitySelectors vendor />
        <div className="grid grid-cols-3 gap-3">
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Purchase Order</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Purchase & Receive</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Payment</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Credit Memo</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Report</button>
        </div>
      </div>

      <div className="space-y-4">
        <Panel title="Vendors">
          <table className="fin-table min-w-full text-[12px]">
            <thead className="fin-table-head text-left">
              <tr><th className="pb-2 font-medium">ID</th><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Telephone 1</th><th className="pb-2 font-medium">Balance</th></tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="fin-table-row">
                  <td className="py-2">{vendor.id}</td>
                  <td className="py-2">{vendor.name}</td>
                  <td className="py-2">{vendor.phone}</td>
                  <td className={`py-2 ${vendor.balance < 0 ? 'fin-danger' : ''}`}>{formatMoney(vendor.balance, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-[1fr,0.9fr]">
          <Panel title="Vendor Reports">
            <div className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Purchase order register</span><ViewLink label="view" /></div>
              <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Purchase journal</span><ViewLink label="view" /></div>
              <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Purchase order journal</span><ViewLink label="view" /></div>
              <button className="fin-link font-medium hover:underline">All Vendor Reports</button>
            </div>
          </Panel>

          <Panel title="Aged Payables">
            <MiniPie />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function InventoryView({ inventories }: { inventories: InventoryRow[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
      <div className="space-y-4">
        <button className="fin-action-btn flex w-full items-center justify-center gap-3 rounded-2xl px-3 py-3 text-[12px] font-medium"><Package size={14} />Inventory <ChevronDown size={14} /></button>
        <div className="grid grid-cols-3 gap-3">
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Purchase Orders</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Receive Inventory</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Adjust Inventory</button>
        </div>
        <Panel title="Inventory Reports">
          <div className="space-y-3 text-[12px]">
            <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Inventory Profitability Report</span><ViewLink label="view" /></div>
            <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Inventory Stock Status Report</span><ViewLink label="view" /></div>
            <div className="flex items-center justify-between border-b border-[#e1e9e4] pb-2"><span>Inventory Unit Activity Report</span><ViewLink label="view" /></div>
            <div className="flex items-center justify-between"><span>Item Costing Report</span><ViewLink label="view" /></div>
          </div>
        </Panel>
      </div>

      <Panel title="Inventories">
        <table className="fin-table min-w-full text-[12px]">
          <thead className="fin-table-head text-left">
            <tr><th className="pb-2 font-medium">No</th><th className="pb-2 font-medium">Item Id</th><th className="pb-2 font-medium">Item Name</th><th className="pb-2 font-medium">Item Class</th></tr>
          </thead>
          <tbody>
            {inventories.map((item) => (
              <tr key={item.id} className="fin-table-row">
                <td className="py-2">{item.id}</td>
                <td className="py-2">{item.itemId}</td>
                <td className="py-2">{item.itemName}</td>
                <td className="py-2">{item.itemClass}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function CompaniesView({ companies }: { companies: CompanyRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-[865px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a39d]" />
          <input placeholder="Search" className="fin-input h-10 w-full rounded-2xl pl-10 pr-3 text-[12px]" />
        </div>
        <button className="fin-action-btn-accent rounded-2xl px-4 py-2 text-[12px] font-semibold">+ New Company</button>
      </div>

      <div className="fin-card overflow-hidden rounded-[24px]">
        <table className="fin-table min-w-full text-[12px]">
          <thead className="fin-panel-header fin-table-head text-left">
            <tr><th className="px-3 py-3 font-medium">Name</th><th className="px-3 py-3 font-medium">Start Date</th><th className="px-3 py-3 font-medium">Users</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Select</th><th className="px-3 py-3 font-medium">Created On</th><th className="px-3 py-3 font-medium">Action</th></tr>
          </thead>
          <tbody className="bg-transparent">
            {companies.map((company, index) => (
              <tr key={company.id} className="fin-table-row">
                <td className="px-3 py-3">{company.name}</td>
                <td className="px-3 py-3">{company.startDate}</td>
                <td className="px-3 py-3"><span className="inline-flex items-center gap-1"><Users size={13} /><span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c86d4b] px-1 text-[10px] text-white">{company.users}</span></span></td>
                <td className="px-3 py-3"><span className="inline-flex rounded-full border border-[#9ed2bd] bg-[#ebf8f2] px-3 py-1 text-[11px] text-[#25765a]">{company.status}</span></td>
                <td className="px-3 py-3"><button className={`h-8 w-[88px] rounded-xl border text-[12px] font-medium ${index === 2 ? 'border-[#dce5df] bg-[#f1f5f1] text-[#93a39d]' : 'border-[#9ecfbd] bg-white text-[#214b41]'}`}>{index === 2 ? 'Opened' : 'Open'}</button></td>
                <td className="px-3 py-3">{company.createdOn}</td>
                <td className="px-3 py-3">{index === 2 ? <button className="rounded-xl border border-[#dce5df] px-2 py-1 text-[#6d7f79]">...</button> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BankingView({ workspace, summary }: { workspace: FinanceWorkspaceState; summary: ReturnType<typeof import('../../finance/engine').calculateAccountingSummary> }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
      <Panel title="Bank Accounts">
        <table className="fin-table min-w-full text-[12px]">
          <thead className="fin-table-head text-left">
            <tr><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium">Code</th><th className="pb-2 font-medium">Balance</th></tr>
          </thead>
          <tbody>
            {workspace.accounts.filter((account) => account.type === 'bank' || account.type === 'cash').map((account) => (
              <tr key={account.id} className="fin-table-row">
                <td className="py-2">{account.name}</td>
                <td className="py-2">{account.code}</td>
                <td className="py-2">{formatMoney(summary.cashFlow.closingCash / 2, workspace.company.baseCurrency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Banking Actions">
        <div className="grid grid-cols-2 gap-3">
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Receive Money</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Make Payment</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Transfer Funds</button>
          <button className="fin-action-btn rounded-2xl px-3 py-3 text-[12px] font-medium">Reconcile Account</button>
        </div>
      </Panel>
    </div>
  );
}
