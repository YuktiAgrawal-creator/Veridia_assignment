import React from 'react';
import {
  LayoutDashboard,
  SlidersHorizontal,
  Sparkles,
  GitCompare,
  Database,
  Building2,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  hasResults,
  resultCount,
  comparedSuppliersCount,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'builder',
      label: 'Requirement Builder',
      icon: SlidersHorizontal,
      badge: 'RFQ',
    },
    {
      id: 'results',
      label: 'Matching Results',
      icon: Sparkles,
      badge: hasResults ? `${resultCount} Found` : null,
      disabled: !hasResults,
    },
    {
      id: 'comparison',
      label: 'Supplier Comparison',
      icon: GitCompare,
      badge: comparedSuppliersCount > 0 ? `${comparedSuppliersCount}` : null,
    },
    {
      id: 'data-quality',
      label: 'Data Quality Insights',
      icon: Database,
      badge: 'Audit',
    },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-200 flex flex-col justify-between border-r border-navy-800 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
              V
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">
                VERIDIA MATCH
              </h1>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight font-medium">
                Intelligent Precision Sourcing
              </p>
            </div>
          </div>
          <div className="mt-3 px-2 py-1 bg-navy-850 rounded text-[10px] text-slate-300 flex items-center gap-1.5 border border-slate-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>1,000 Verified Suppliers (India)</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveView(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : item.disabled
                    ? 'opacity-40 text-slate-500 cursor-not-allowed'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-brand-700 text-white'
                        : 'bg-navy-800 text-slate-300 border border-navy-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-navy-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Deterministic Engine</span>
          <span className="text-emerald-400 font-mono font-medium">Active (v1.0)</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Origin Region</span>
          <span className="text-slate-200">India Industrial Hubs</span>
        </div>
        <p className="text-[10px] text-slate-500 pt-1 leading-relaxed border-t border-navy-800/60">
          "Finding the right manufacturing partner, intelligently."
        </p>
      </div>
    </aside>
  );
}
