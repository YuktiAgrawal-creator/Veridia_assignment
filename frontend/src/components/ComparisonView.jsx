import React from 'react';
import {
  GitCompare,
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
  Box,
  Truck,
  ExternalLink,
  Mail,
  ArrowRight
} from 'lucide-react';

export default function ComparisonView({
  comparedSuppliers,
  setComparedSuppliers,
  setActiveView,
}) {
  const removeSupplier = (recordId) => {
    setComparedSuppliers(comparedSuppliers.filter((s) => s.record_id !== recordId));
  };

  if (comparedSuppliers.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <GitCompare className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">
            No Manufacturers Selected for Comparison
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Check the "Compare" box on up to 3 manufacturer cards in Matching Results to inspect side-by-side technical trade-offs.
          </p>
          <button
            onClick={() => setActiveView('results')}
            className="mt-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>Return to Matching Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Side-by-Side Supplier Comparison Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare capabilities, delivery lead times, certification status, and capacities for {comparedSuppliers.length} selected supplier(s).
          </p>
        </div>
        <button
          onClick={() => setComparedSuppliers([])}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800"
        >
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs divide-y divide-slate-200">
          {/* Header Row */}
          <thead className="bg-slate-50/80">
            <tr>
              <th className="p-4 w-48 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                Manufacturer
              </th>
              {comparedSuppliers.map((s) => (
                <th key={s.record_id} className="p-4 min-w-[260px] align-top">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {s.manufacturer_id}
                      </span>
                      <button
                        onClick={() => removeSupplier(s.record_id)}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {s.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.city}, {s.state_name}</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'ELIGIBLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status}
                      </span>
                      <span className="text-lg font-black text-brand-700 font-mono">
                        {s.match_score} <span className="text-xs font-normal text-slate-400">/100</span>
                      </span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {/* Score Breakdown */}
            <tr className="bg-brand-50/20">
              <td className="p-4 font-bold text-slate-800">
                Score Breakdown
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4 space-y-1 font-mono text-[11px]">
                  <div>Delivery: <strong className="text-slate-900">{s.score_breakdown.delivery_suitability}</strong>/35</div>
                  <div>Capacity: <strong className="text-slate-900">{s.score_breakdown.capacity_suitability}</strong>/30</div>
                  <div>Quality Cert: <strong className="text-slate-900">{s.score_breakdown.certification_quality}</strong>/20</div>
                  <div>Track Record: <strong className="text-slate-900">{s.score_breakdown.track_record}</strong>/15</div>
                </td>
              ))}
            </tr>

            {/* Lead Time & Delivery */}
            <tr>
              <td className="p-4 font-bold text-slate-800">
                Lead Time Turnaround
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4">
                  <div className="font-bold text-slate-900 text-sm">
                    {s.lead_time_days ? `${s.lead_time_days} days (${s.lead_time_weeks} wks)` : 'Unrecorded (Warning)'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    OTD: {s.on_time_delivery_pct}% • Rating: Tier {s.delivery_rating}
                  </div>
                </td>
              ))}
            </tr>

            {/* Monthly Capacity & Order Range */}
            <tr>
              <td className="p-4 font-bold text-slate-800">
                Capacity & Order Batch Bounds
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4 space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {s.capacity_units_per_month.toLocaleString()} units / month
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    MOQ: {s.min_order_qty.toLocaleString()} • Max Batch: {s.max_order_qty.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Enterprise Tier: {s.company_size}
                  </div>
                </td>
              ))}
            </tr>

            {/* Certifications & Audit Expiry */}
            <tr>
              <td className="p-4 font-bold text-slate-800">
                Quality Certifications
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4 space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {s.certifications.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Expiry: {s.certification_expiry || 'Unrecorded'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Last Audit: {s.last_audit_date || 'Unrecorded'}
                  </div>
                </td>
              ))}
            </tr>

            {/* Materials Supported */}
            <tr>
              <td className="p-4 font-bold text-slate-800">
                Supported Materials
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {s.materials.map((m) => (
                      <span key={m} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-medium capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Manufacturing Processes */}
            <tr>
              <td className="p-4 font-bold text-slate-800">
                Manufacturing Processes
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4 space-y-1">
                  <div className="text-slate-800 font-semibold">
                    Primary: {s.primary_process}
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {s.processes.map((p) => (
                      <span key={p} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Export Track Record */}
            <tr>
              <td className="p-4 font-bold text-slate-800">
                International Export Experience
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4">
                  <div className="font-bold text-slate-900">
                    {s.export_experience_years} years handling exports
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ocean & air export compliance clearance required
                  </div>
                </td>
              ))}
            </tr>

            {/* Contact & Verification */}
            <tr>
              <td className="p-4 font-bold text-slate-800">
                Direct Contact
              </td>
              {comparedSuppliers.map((s) => (
                <td key={s.record_id} className="p-4 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1 font-mono">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{s.contact_email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                    <span>{s.website}</span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
