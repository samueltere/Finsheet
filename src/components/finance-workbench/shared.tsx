import React from 'react';
import { ChevronDown, CreditCard, Package, UserCircle2, Users } from 'lucide-react';

export function Panel({
  title,
  action,
  className = '',
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`fin-card overflow-hidden rounded-[24px] ${className}`}>
      <header className="fin-panel-header flex items-center justify-between px-4 py-3">
        <h3 className="text-[13px] font-semibold text-[#24312f]">{title}</h3>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ViewLink({ label = 'View' }: { label?: string }) {
  return <button className="fin-link text-[12px] font-medium hover:underline">{label}</button>;
}

export function MiniPie() {
  return (
    <div className="flex items-center gap-8">
      <div
        className="h-28 w-28 rounded-full border border-[#d7e2db] shadow-[inset_0_0_0_10px_rgba(255,255,255,0.55)]"
        style={{
          background:
            'conic-gradient(#1fa37a 0deg 90deg, #6dc7a7 90deg 180deg, #3f5f58 180deg 270deg, #c86d4b 270deg 360deg)',
        }}
      />
      <div className="space-y-2 text-[12px] text-[#63716d]">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1fa37a]" />0-30</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#6dc7a7]" />31-60</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#3f5f58]" />61-90</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#c86d4b]" />Over 90</div>
      </div>
    </div>
  );
}

export function EntitySelectors({ customer = false, vendor = false }: { customer?: boolean; vendor?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button className="fin-action-btn flex items-center justify-between rounded-2xl px-3 py-3 text-[12px] font-medium">
        <span className="flex items-center gap-2">
          {customer ? <Users size={14} /> : <UserCircle2 size={14} />}
          {customer ? 'Customer' : vendor ? 'Vendor' : 'Entity'}
        </span>
        <ChevronDown size={14} />
      </button>
      <button className="fin-action-btn flex items-center justify-between rounded-2xl px-3 py-3 text-[12px] font-medium">
        <span className="flex items-center gap-2"><Package size={14} />Project</span>
        <ChevronDown size={14} />
      </button>
      <button className="fin-action-btn flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[12px] font-medium">
        <CreditCard size={14} />Tax
      </button>
    </div>
  );
}
