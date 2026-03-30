import { useState } from 'react';
import { Search, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Wat we doen', hasChevron: true },
  { label: 'Wonen', hasChevron: true },
  { label: 'Werken', hasChevron: true },
  { label: 'Verbinden', hasChevron: false },
  { label: 'Projecten', hasChevron: false },
  { label: 'Thema\'s', hasChevron: true },
  { label: 'Nieuws', hasChevron: false },
  { label: 'Over ons', hasChevron: true },
  { label: 'Contact', hasChevron: false },
];

const utilityItems = [
  { label: 'Werken bij' },
  { label: 'Investor relations' },
  { label: 'Contact' },
];

export function HomeSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-5 left-5 z-[60] flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 backdrop-blur-xl shadow-lg border border-white/40 lg:hidden"
      >
        <Menu className="h-5 w-5 text-[#0A1929]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[70] bg-[#0A1929]/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-[80] flex h-full w-[280px] flex-col bg-white/70 backdrop-blur-2xl border-r border-[#E8ECF1]/60',
          'transition-transform duration-300 ease-out',
          'lg:sticky lg:translate-x-0 lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-5 right-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F0F3F7] lg:hidden"
        >
          <X className="h-4 w-4 text-[#0A1929]" />
        </button>

        {/* Logo */}
        <div className="px-7 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5C518] shadow-sm">
              <span className="text-lg font-black text-[#0A1929]">A</span>
            </div>
            <div>
              <span className="text-[15px] font-extrabold tracking-tight text-[#0A1929]">Aarding</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[2px] text-[#6B7F99]">Rapport</span>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#2A3F5F] transition-all hover:bg-[#F0F3F7] hover:text-[#0A1929]"
                >
                  <span>{item.label}</span>
                  {item.hasChevron && (
                    <ChevronRight className="h-3.5 w-3.5 text-[#A0B0C4] transition-transform group-hover:translate-x-0.5 group-hover:text-[#6B7F99]" />
                  )}
                </a>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-5 h-px bg-[#E8ECF1]/80" />

          {/* Utility */}
          <ul className="space-y-0.5">
            {utilityItems.map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  className="block rounded-xl px-3 py-2 text-[12px] font-medium text-[#6B7F99] transition-colors hover:text-[#2A3F5F] hover:bg-[#F0F3F7]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Search */}
        <div className="px-5 pb-6">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#F0F3F7]/80 px-3.5 py-2.5 border border-[#E8ECF1]/50">
            <Search className="h-4 w-4 text-[#A0B0C4]" />
            <input
              type="text"
              placeholder="Zoeken..."
              className="flex-1 bg-transparent text-[12px] font-medium text-[#2A3F5F] placeholder:text-[#A0B0C4] outline-none"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
