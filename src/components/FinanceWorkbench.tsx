import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, EyeOff, Grid2x2, HelpCircle, Info, LogOut, Printer, RefreshCw, Search, Upload } from 'lucide-react';
import { fetchFinanceWorkspace, saveFinanceWorkspace } from '../finance/api';
import { calculateAccountingSummary } from '../finance/engine';
import { financeSeed } from '../finance/seed';
import { FinanceWorkspaceState } from '../finance/types';
import { companiesSeed, customersSeed, inventorySeed, MaintainKey, maintainLabel, maintainMenuItems, navItems, taskLabel, taskMenuItems, TaskKey, topTabForPage, topTabs, toolbarDate, toolbarPeriod, vendorsSeed, WorkspacePage } from './finance-workbench/data';
import { BankingView, CompaniesView, CustomersView, InventoryView, VendorsView } from './finance-workbench/entityViews';
import { BusinessStatusView, CompanyInfoView } from './finance-workbench/companyViews';
import { TaskWorkspace } from './finance-workbench/taskViews';
import { MaintainWorkspace } from './finance-workbench/maintainViews';

function ToolbarButton({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <button className="fin-toolbar-btn inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-medium">
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
  const [activeTask, setActiveTask] = useState<TaskKey | null>(null);
  const [activeMaintain, setActiveMaintain] = useState<MaintainKey | null>(null);
  const [tasksMenuOpen, setTasksMenuOpen] = useState(false);
  const [maintainMenuOpen, setMaintainMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customersData, setCustomersData] = useState(customersSeed);
  const [vendorsData, setVendorsData] = useState(vendorsSeed);
  const [inventoriesData, setInventoriesData] = useState(inventorySeed);
  const [companiesData] = useState(companiesSeed);

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
  const customers = useMemo(() => customersData.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [customersData, searchTerm]);
  const vendors = useMemo(() => vendorsData.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [vendorsData, searchTerm]);
  const inventories = useMemo(() => inventoriesData.filter((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase())), [inventoriesData, searchTerm]);
  const companies = useMemo(() => companiesData.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [companiesData, searchTerm]);

  const pageTitle = {
    'business-status': 'Business Status',
    'company-info': 'Company',
    customers: 'Customers & Sales',
    vendors: 'Vendors & Purchases',
    inventory: 'Inventory Dashboard',
    banking: 'Banking',
    companies: 'Companies',
  }[activePage];
  const currentTitle = activeTask ? taskLabel(activeTask) : activeMaintain ? maintainLabel(activeMaintain) : pageTitle;

  if (loading) {
    return (
      <div className="fin-shell-bg flex min-h-screen items-center justify-center">
        <div className="fin-card rounded-[28px] px-8 py-7 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#668178]">FinSheet</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#172126]">Loading workspace</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="fin-shell-bg min-h-screen text-[#172126]">
      <div className="flex min-h-screen">
        <aside className="fin-sidebar flex w-[238px] shrink-0 flex-col">
          <div className="flex h-[64px] items-center border-b border-white/6 px-5">
            <button className="rounded-xl p-2 text-[#d7e6de] hover:bg-white/6"><Grid2x2 size={20} /></button>
          </div>
          <div className="px-5 py-6">
            <div className="mb-6 rounded-[26px] border border-white/8 bg-white/4 px-4 py-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="fin-brand-mark flex h-10 w-10 items-center justify-center rounded-2xl text-white"><Grid2x2 size={16} /></div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#90b1a6]">FinSheet</p>
                  <span className="block text-sm text-[#d7e6de]">Finance hub</span>
                </div>
              </div>
              <p className="text-[12px] leading-6 text-[#a9c2b8]">Original ERP workspace for accounting, inventory, company operations, and cash management.</p>
            </div>
            <nav className="space-y-2">
              {navItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setActivePage(key);
                    setActiveTask(null);
                    setActiveMaintain(null);
                    setTasksMenuOpen(false);
                    setMaintainMenuOpen(false);
                  }}
                  className={`fin-nav-btn flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[13px] ${activePage === key ? 'fin-nav-btn-active' : ''}`}
                >
                  <Icon size={15} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto space-y-4 px-5 pb-8 text-[12px] text-[#a9c2b8]">
            <button className="flex items-center gap-2 hover:text-white"><HelpCircle size={16} />Help Center</button>
            <button className="flex items-center gap-2 hover:text-white"><LogOut size={16} />Log out</button>
            <p className="pl-6 text-[11px] text-[#88a59b]">v1.0.0</p>
          </div>
        </aside>

        <main className="flex-1">
          <div className="fin-topbar sticky top-0 z-10 px-5 py-5">
            <div className="fin-surface relative flex items-center gap-4 rounded-[28px] px-5 py-3">
              <div className="flex items-center gap-4 overflow-x-auto">
                {topTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'Tasks') {
                        setTasksMenuOpen(!tasksMenuOpen);
                        setMaintainMenuOpen(false);
                        return;
                      }
                      if (tab === 'Maintain') {
                        setMaintainMenuOpen(!maintainMenuOpen);
                        setTasksMenuOpen(false);
                        return;
                      }
                      setTasksMenuOpen(false);
                      setMaintainMenuOpen(false);
                    }}
                    className={`fin-top-tab rounded-2xl px-4 py-3 text-[12px] font-medium whitespace-nowrap ${(activeTask ? 'Tasks' : activeMaintain ? 'Maintain' : topTabForPage(activePage)) === tab ? 'fin-top-tab-active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a39d]" />
                  <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search FinSheet" className="fin-input h-12 w-[340px] rounded-2xl pl-10 pr-4 text-[13px]" />
                </div>
                <button className="rounded-2xl border border-[#dbe4de] bg-white/76 p-3 text-[#355149] hover:border-[#9fd1be] hover:bg-[#eef8f4]"><Bell size={18} /></button>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#16332d] text-sm font-semibold text-white shadow-[0_12px_28px_rgba(22,51,45,0.18)]">S</div>
              </div>
              {tasksMenuOpen && (
                <div className="absolute left-[220px] top-[78px] z-20 w-[360px] rounded-[24px] border border-[#dbe5df] bg-[rgba(255,255,255,0.96)] p-3 shadow-[0_24px_40px_rgba(22,51,45,0.14)] backdrop-blur-xl">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#769186]">Task Center</p>
                  <div className="fin-scroll max-h-[460px] space-y-1 overflow-y-auto pr-1">
                    {taskMenuItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setActiveTask(item.key);
                          setActiveMaintain(null);
                          setTasksMenuOpen(false);
                        }}
                        className={`w-full rounded-2xl px-3 py-3 text-left hover:bg-[#eef6f1] ${activeTask === item.key ? 'bg-[#eef6f1]' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[13px] font-medium text-[#1f2d29]">{item.label}</span>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[#7a8a85]">{item.postingMode}</span>
                        </div>
                        <p className="mt-1 text-[12px] text-[#60706b]">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {maintainMenuOpen && (
                <div className="absolute left-[134px] top-[78px] z-20 w-[360px] rounded-[24px] border border-[#dbe5df] bg-[rgba(255,255,255,0.96)] p-3 shadow-[0_24px_40px_rgba(22,51,45,0.14)] backdrop-blur-xl">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#769186]">Maintain Center</p>
                  <div className="fin-scroll max-h-[460px] space-y-1 overflow-y-auto pr-1">
                    {maintainMenuItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setActiveMaintain(item.key);
                          setActiveTask(null);
                          setMaintainMenuOpen(false);
                        }}
                        className={`w-full rounded-2xl px-3 py-3 text-left hover:bg-[#eef6f1] ${activeMaintain === item.key ? 'bg-[#eef6f1]' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[13px] font-medium text-[#1f2d29]">{item.label}</span>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[#7a8a85]">master</span>
                        </div>
                        <p className="mt-1 text-[12px] text-[#60706b]">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-5">
            <section className="fin-card rounded-[30px] p-5">
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#d9e4de] pb-5">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#769186]">Workspace</p>
                  <h1 className="text-[22px] font-semibold text-[#172126]">{currentTitle}</h1>
                </div>
                <div className="fin-pill rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]">FinSheet ERP</div>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <ToolbarButton icon={EyeOff} label="Hide" />
                <ToolbarButton icon={RefreshCw} label="Refresh" />
                <ToolbarButton icon={Printer} label="Print" />
                <ToolbarButton icon={CalendarDays} label={`System Date: ${toolbarDate()}`} />
                <ToolbarButton icon={CalendarDays} label={`Period 1: ${toolbarPeriod()}`} />
                <ToolbarButton icon={Upload} label="Export Reports" />
                <button className="fin-toolbar-btn rounded-full p-2 text-[#355149]"><Info size={16} /></button>
                <div className="fin-status-pill ml-auto rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {syncState === 'saving' && 'Saving'}
                  {syncState === 'saved' && 'Saved'}
                  {syncState === 'error' && 'Sync error'}
                  {syncState === 'idle' && 'Connected'}
                </div>
              </div>

              {activeTask ? (
                <TaskWorkspace
                  activeTask={activeTask}
                  workspace={workspace}
                  setWorkspace={setWorkspace}
                  customers={customers}
                  vendors={vendors}
                  inventories={inventories}
                  companies={companies}
                  onBack={() => setActiveTask(null)}
                />
              ) : activeMaintain ? (
                <MaintainWorkspace
                  activeMaintain={activeMaintain}
                  workspace={workspace}
                  setWorkspace={setWorkspace}
                  customers={customersData}
                  setCustomers={setCustomersData}
                  vendors={vendorsData}
                  setVendors={setVendorsData}
                  inventories={inventoriesData}
                  setInventories={setInventoriesData}
                  onBack={() => setActiveMaintain(null)}
                />
              ) : (
                <>
                  {activePage === 'company-info' && <CompanyInfoView workspace={workspace} />}
                  {activePage === 'business-status' && <BusinessStatusView workspace={workspace} vendors={vendors} summary={summary} />}
                  {activePage === 'customers' && <CustomersView customers={customers} currency={workspace.company.baseCurrency} />}
                  {activePage === 'vendors' && <VendorsView vendors={vendors} currency={workspace.company.baseCurrency} />}
                  {activePage === 'inventory' && <InventoryView inventories={inventories} />}
                  {activePage === 'companies' && <CompaniesView companies={companies} />}
                  {activePage === 'banking' && <BankingView workspace={workspace} summary={summary} />}
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
