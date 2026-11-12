import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Box,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Search,
  GitCompare,
  SlidersHorizontal,
  ExternalLink,
  Info
} from 'lucide-react';
import SupplierModal from './SupplierModal';

export default function ResultsView({
  matchData,
  setActiveView,
  comparedSuppliers,
  setComparedSuppliers,
}) {
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ELIGIBLE, NEEDS_VERIFICATION
  const [sortBy, setSortBy] = useState('score'); // score, lead_time, capacity
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierForModal, setSelectedSupplierForModal] = useState(null);

  if (!matchData || !matchData.results) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Active Match Results</h3>
          <p className="text-xs text-slate-500 mt-1">
            Submit a buyer requirement using the Requirement Builder to see ranked recommendations.
          </p>
          <button
            onClick={() => setActiveView('builder')}
            className="mt-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Go to Requirement Builder
          </button>
        </div>
      </div>
    );
  }

  const {
    request_id,
    created_at,
    evaluation_date,
    requirements,
    total_scanned,
    total_eligible,
    total_needs_verification,
    total_ineligible,
    results,
  } = matchData;

  // Filter
  let filtered = results.filter((m) => {
    if (statusFilter === 'ELIGIBLE' && m.status !== 'ELIGIBLE') return false;
    if (statusFilter === 'NEEDS_VERIFICATION' && m.status !== 'NEEDS_VERIFICATION') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchCity = m.city.toLowerCase().includes(q);
      const matchId = m.manufacturer_id.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchId) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'score') {
      return b.match_score - a.match_score;
    } else if (sortBy === 'lead_time') {
      const lta = a.lead_time_days ?? 999;
      const ltb = b.lead_time_days ?? 999;
      return lta - ltb;
    } else if (sortBy === 'capacity') {
      return b.capacity_units_per_month - a.capacity_units_per_month;
    }
    return 0;
  });

  const toggleCompare = (supplier) => {
    const isAlready = comparedSuppliers.some((s) => s.record_id === supplier.record_id);
    if (isAlready) {
      setComparedSuppliers(comparedSuppliers.filter((s) => s.record_id !== supplier.record_id));
    } else {
      if (comparedSuppliers.length >= 3) {
        alert('You can compare a maximum of 3 manufacturers side-by-side.');
        return;
      }
      setComparedSuppliers([...comparedSuppliers, supplier]);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: RFQ Summary & Audit Metrics */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 md:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Target Requirements
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Evaluation Date: {evaluation_date}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-sm font-bold text-slate-900 capitalize">
                {requirements.material}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-sm font-semibold text-slate-800 capitalize">
                {requirements.process}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {requirements.quantity.toLocaleString()} units
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                {requirements.certification || 'Any Certification'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                &le; {requirements.delivery_deadline_days} Days
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">
                Ship to: <strong>{requirements.destination_country}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => setActiveView('builder')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Modify RFQ</span>
            </button>
          </div>
        </div>

        {/* Qualification Funnel Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 font-medium">Total Evaluated:</span>
            <p className="text-base font-bold text-slate-800 font-mono mt-0.5">
              {total_scanned.toLocaleString()} suppliers
            </p>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/80">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hard Eligible:</span>
            </span>
            <p className="text-base font-bold text-emerald-800 font-mono mt-0.5">
              {total_eligible.toLocaleString()} candidates
            </p>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
            <span className="text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Needs Verification:</span>
            </span>
            <p className="text-base font-bold text-amber-800 font-mono mt-0.5">
              {total_needs_verification.toLocaleString()} candidates
            </p>
          </div>
          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200/80">
            <span className="text-rose-700 font-medium">Disqualified:</span>
            <p className="text-base font-bold text-rose-800 font-mono mt-0.5">
              {total_ineligible.toLocaleString()} records
            </p>
          </div>
        </div>
      </div>

      {/* Floating Comparison Tray */}
      {comparedSuppliers.length > 0 && (
        <div className="bg-navy-900 text-white rounded-xl p-3 px-5 shadow-lg flex items-center justify-between sticky top-20 z-10 border border-navy-800">
          <div className="flex items-center gap-3 text-xs">
            <GitCompare className="w-4 h-4 text-brand-400" />
            <span>
              <strong>{comparedSuppliers.length}</strong> manufacturer(s) selected for comparison
            </span>
            <span className="hidden sm:inline text-slate-400">
              ({comparedSuppliers.map((s) => s.name).join(', ')})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setComparedSuppliers([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={() => setActiveView('comparison')}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
            >
              <span>View Comparison Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Qualified ({results.length})
          </button>
          <button
            onClick={() => setStatusFilter('ELIGIBLE')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'ELIGIBLE'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Eligible ({total_eligible})
          </button>
          <button
            onClick={() => setStatusFilter('NEEDS_VERIFICATION')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'NEEDS_VERIFICATION'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Needs Verification ({total_needs_verification})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, city, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 w-48 sm:w-56"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="score">Sort by Score (Highest)</option>
              <option value="lead_time">Sort by Lead Time (Fastest)</option>
              <option value="capacity">Sort by Capacity (Highest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">
            No Manufacturers Qualified for Current Criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            None of the 1,000 audited manufacturers satisfied all mandatory Stage-1 eligibility requirements.
            Try extending the delivery deadline, reducing batch quantity, or adjusting the certification standard.
          </p>
          <button
            onClick={() => setActiveView('builder')}
            className="mt-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Adjust Buyer Parameters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((supplier, idx) => {
            const isCompared = comparedSuppliers.some(
              (s) => s.record_id === supplier.record_id
            );

            return (
              <div
                key={supplier.record_id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-brand-400 shadow-xs hover:shadow-md transition-all p-5 md:p-6 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        #{idx + 1} • {supplier.manufacturer_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          supplier.status === 'ELIGIBLE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {supplier.status === 'ELIGIBLE' ? '✓ ELIGIBLE' : '⚠ NEEDS VERIFICATION'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {supplier.company_size} Enterprise
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {supplier.name}
                    </h3>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{supplier.full_address}</span>
                    </p>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-brand-700 tracking-tight">
                          {supplier.match_score}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">/100</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Compatibility Score
                      </span>
                    </div>

                    {/* Compare Checkbox */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none mt-2">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(supplier)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                      />
                      <span className="font-medium">Compare</span>
                    </label>
                  </div>
                </div>

                {/* Core Attributes Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Lead Time
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {supplier.lead_time_days ? `${supplier.lead_time_days} days (${supplier.lead_time_weeks} wks)` : 'Unrecorded (Warning)'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Monthly Capacity
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {supplier.capacity_units_per_month?.toLocaleString()} units
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Order Batch Range
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {supplier.min_order_qty?.toLocaleString()} - {supplier.max_order_qty?.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Track Record
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {supplier.on_time_delivery_pct}% OTD ({supplier.export_experience_years} yrs exp)
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Mini Meters */}
                <div className="bg-brand-50/40 p-3 rounded-lg border border-brand-100 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">Delivery:</span>{' '}
                    <strong className="text-slate-800">{supplier.score_breakdown.delivery_suitability}/35</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Capacity:</span>{' '}
                    <strong className="text-slate-800">{supplier.score_breakdown.capacity_suitability}/30</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Certifications:</span>{' '}
                    <strong className="text-slate-800">{supplier.score_breakdown.certification_quality}/20</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Track Record:</span>{' '}
                    <strong className="text-slate-800">{supplier.score_breakdown.track_record}/15</strong>
                  </div>
                </div>

                {/* Why this manufacturer matched */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Why Recommended:
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {supplier.reasons.slice(0, 3).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warnings summary */}
                {supplier.warnings.length > 0 && (
                  <div className="text-[11px] bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Notice:</span> {supplier.warnings[0]}
                      {supplier.warnings.length > 1 && (
                        <span className="text-amber-700 ml-1">
                          (+{supplier.warnings.length - 1} more caveats in profile)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {supplier.certifications.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedSupplierForModal(supplier)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 hover:underline"
                  >
                    <span>View Full Supplier Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Supplier Modal Drawer */}
      {selectedSupplierForModal && (
        <SupplierModal
          supplier={selectedSupplierForModal}
          onClose={() => setSelectedSupplierForModal(null)}
          destinationCountry={requirements.destination_country}
        />
      )}
    </div>
  );
}
