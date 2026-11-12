import React from 'react';
import { ShieldCheck, Plus, Calendar, Globe2, Activity } from 'lucide-react';

export default function Topbar({
  activeView,
  setActiveView,
  evaluationDate,
  serverStatus,
  requestId,
}) {
  const titles = {
    dashboard: 'Manufacturer Network Overview',
    builder: 'Precision Sourcing Requirement Builder',
    results: 'Intelligent Matchmaking Recommendations',
    comparison: 'Side-by-Side Manufacturer Matrix',
    'data-quality': 'Dataset Profiling & Quality Governance',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {titles[activeView] || 'Veridia Match'}
        </h2>
        {requestId && activeView === 'results' && (
          <span className="hidden md:inline-flex text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
            Req: {requestId.slice(0, 8)}...
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Evaluation Date Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Eval Date:</span>
          <span className="font-semibold text-slate-700">{evaluationDate || new Date().toISOString().slice(0, 10)}</span>
        </div>

        {/* System Health */}
        <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md">
          <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          <span className="text-slate-600 font-medium">
            {serverStatus === 'online' ? 'Engine Ready' : 'Connecting...'}
          </span>
        </div>

        {/* Quick RFQ action */}
        {activeView !== 'builder' && (
          <button
            onClick={() => setActiveView('builder')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New RFQ</span>
          </button>
        )}
      </div>
    </header>
  );
}
