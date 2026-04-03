import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, EyeOff, Grid2x2, HelpCircle, Info, LogOut, Printer, RefreshCw, Search, Upload } from 'lucide-react';
import { fetchFinanceWorkspace, saveFinanceWorkspace } from '../finance/api';
import { calculateAccountingSummary } from '../finance/engine';
import { financeSeed } from '../finance/seed';
import { FinanceWorkspaceState } from '../finance/types';
import { navItems, topTabForPage, topTabs, toolbarDate, toolbarPeriod, customersSeed, vendorsSeed, inventorySeed, companiesSeed, WorkspacePage } from './finance-workbench/data';
import { BankingView, CompaniesView, CustomersView, InventoryView, VendorsView } from './finance-workbench/entityViews';
import { BusinessStatusView, CompanyInfoView } from './finance-workbench/companyViews';

function ToolbarButton({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d8dee8] bg-white px-3 text-[12px] font-medium text-[#556173] hover:bg-[#f8fbff]">
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}

export function FinanceWorkbench() {
  const [workspace, setWorkspace] = useState<FinanceWorkspaceState>(financeSeed);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activePage, setActivePage] = useState<WorkspacePage>('company-info');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const remoteWorkspace = await fetchFinanceWorkspace();
        if (isMounted) setWorkspace(remoteWorkspace);
      } catch (error) {
        console.error('Failed to load finance workspace', error);
      } finally {
        if (isMounted) setLoading(false);
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
  const customers = useMemo(() => customersSeed.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
  const vendors = useMemo(() => vendorsSeed.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
  const inventories = useMemo(() => inventorySeed.filter((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
  const companies = useMemo(() => companiesSeed.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);

  const pageTitle = {
    'business-status': 'Business Status',
    'company-info': 'Company',
    customers: 'Customers & Sales',
    vendors: 'Vendors & Purchases',
    inventory: 'Inventory Dashboard',
    banking: 'Banking',
    companies: 'Companies',
  }[activePage];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="rounded-xl border border-[#d8dee8] bg-white px-8 py-7 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6d7786]">FinSheet</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#2d3642]">Loading workspace</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#2d3642]">
      <div className="flex min-h-screen">
        <aside className="flex w-[150px] shrink-0 flex-col border-r border-[#dbe2ea] bg-[#f4f6fa]">
          <div className="flex h-[54px] items-center border-b border-[#e6ebf2] px-3">
            <button className="rounded-md p-1 text-[#4b5564] hover:bg-white"><Grid2x2 size={22} /></button>
          </div>
          <div className="px-3 py-4">
            <div className="mb-4 flex items-center gap-2 px-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#f4553c] text-white"><Grid2x2 size={12} /></div>
              <span className="font-serif text-[18px] font-semibold text-[#5a2130]">FinSheet</span>
            </div>
            <nav className="space-y-1">
              {navItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActivePage(key)}
                  className={`flex w-full items-center gap-2 rounded-md border px-3 py-3 text-left text-[12px] ${activePage === key ? 'border-[#0d6efd] bg-white text-[#111827]' : 'border-transparent text-[#95a0b1] hover:border-[#d9e1ea] hover:bg-white'}`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto space-y-4 px-5 pb-8 text-[12px] text-[#95a0b1]">
            <button className="flex items-center gap-2 hover:text-[#5b6677]"><HelpCircle size={16} />Help Center</button>
            <button className="flex items-center gap-2 hover:text-[#5b6677]"><LogOut size={16} />Log out</button>
            <p className="pl-6 text-[11px]">v1.0.0</p>
          </div>
        </aside>

        <main className="flex-1">
          <div className="sticky top-0 z-10 border-b border-[#e4e9f1] bg-[#fffdfb] px-4 py-4">
            <div className="flex items-center gap-4 rounded-xl border border-[#dbe2ea] bg-white px-4 py-2">
              <div className="flex items-center gap-4 overflow-x-auto">
                {topTabs.map((tab) => (
                  <button key={tab} className={`border-b-2 px-3 py-2 text-[12px] font-medium whitespace-nowrap ${topTabForPage(activePage) === tab ? 'border-[#0bb24c] text-[#0bb24c]' : 'border-transparent text-[#252f3d]'}`}>{tab}</button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa5b5]" />
                  <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search" className="h-14 w-[340px] rounded-lg border border-[#d8dee8] pl-10 pr-4 text-[13px] outline-none focus:border-[#a9c9ff]" />
                </div>
                <button className="text-[#2f3947]"><Bell size={20} /></button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0bb24c] text-sm font-semibold text-white">S</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <section className="rounded-xl border border-[#dbe2ea] bg-white p-4">
              <div className="mb-5 border-b border-[#e6ebf2] pb-4">
                <h1 className="text-[16px] font-semibold text-[#2d3642]">{pageTitle}</h1>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <ToolbarButton icon={EyeOff} label="Hide" />
                <ToolbarButton icon={RefreshCw} label="Refresh" />
                <ToolbarButton icon={Printer} label="Print" />
                <ToolbarButton icon={CalendarDays} label={`System Date: ${toolbarDate()}`} />
                <ToolbarButton icon={CalendarDays} label={`Period 1: ${toolbarPeriod()}`} />
                <ToolbarButton icon={Upload} label="Export Reports" />
                <button className="rounded-full border border-[#2f3947] p-1 text-[#2f3947]"><Info size={16} /></button>
                <div className="ml-auto rounded-full border border-[#dbe2ea] bg-[#fbfcfe] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d7786]">
                  {syncState === 'saving' && 'Saving'}
                  {syncState === 'saved' && 'Saved'}
                  {syncState === 'error' && 'Sync error'}
                  {syncState === 'idle' && 'Connected'}
                </div>
              </div>

              {activePage === 'company-info' && <CompanyInfoView workspace={workspace} />}
              {activePage === 'business-status' && <BusinessStatusView workspace={workspace} vendors={vendors} summary={summary} />}
              {activePage === 'customers' && <CustomersView customers={customers} currency={workspace.company.baseCurrency} />}
              {activePage === 'vendors' && <VendorsView vendors={vendors} currency={workspace.company.baseCurrency} />}
              {activePage === 'inventory' && <InventoryView inventories={inventories} />}
              {activePage === 'companies' && <CompaniesView companies={companies} />}
              {activePage === 'banking' && <BankingView workspace={workspace} summary={summary} />}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
