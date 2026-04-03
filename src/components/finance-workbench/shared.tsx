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
    <section className={`overflow-hidden rounded-xl border border-[#d8dee8] bg-white ${className}`}>
      <header className="flex items-center justify-between border-b border-[#e7ecf3] bg-[#f7f8fb] px-4 py-3">
        <h3 className="text-[13px] font-semibold text-[#2d3642]">{title}</h3>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ViewLink({ label = 'View' }: { label?: string }) {
  return <button className="text-[12px] font-medium text-[#0bb24c] hover:underline">{label}</button>;
}

export function MiniPie() {
  return (
    <div className="flex items-center gap-8">
      <div
        className="h-28 w-28 rounded-full border border-[#d8dee8]"
        style={{
          background:
            'conic-gradient(#5b8ff9 0deg 90deg, #61d8a1 90deg 180deg, #65789b 180deg 270deg, #f6bd16 270deg 360deg)',
        }}
      />
      <div className="space-y-2 text-[12px] text-[#707a89]">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#5b8ff9]" />0-30</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#61d8a1]" />31-60</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#65789b]" />61-90</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f6bd16]" />Over 90</div>
      </div>
    </div>
  );
}

export function EntitySelectors({ customer = false, vendor = false }: { customer?: boolean; vendor?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button className="flex items-center justify-between rounded-md border border-[#d8dee8] px-3 py-3 text-[12px] font-medium">
        <span className="flex items-center gap-2">
          {customer ? <Users size={14} /> : <UserCircle2 size={14} />}
          {customer ? 'Customer' : vendor ? 'Vendor' : 'Entity'}
        </span>
        <ChevronDown size={14} />
      </button>
      <button className="flex items-center justify-between rounded-md border border-[#d8dee8] px-3 py-3 text-[12px] font-medium">
        <span className="flex items-center gap-2"><Package size={14} />Project</span>
        <ChevronDown size={14} />
      </button>
      <button className="flex items-center justify-center gap-2 rounded-md border border-[#d8dee8] px-3 py-3 text-[12px] font-medium">
        <CreditCard size={14} />Tax
      </button>
    </div>
  );
}
