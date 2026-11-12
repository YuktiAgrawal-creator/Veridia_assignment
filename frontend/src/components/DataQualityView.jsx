import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileSpreadsheet,
  AlertOctagon,
  HelpCircle
} from 'lucide-react';
import { fetchDataQuality } from '../api/client';

export default function DataQualityView() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadQuality() {
      try {
        setLoading(true);
        const data = await fetchDataQuality();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dataset quality audit report.');
      } finally {
        setLoading(false);
      }
    }
    loadQuality();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Auditing 1,000 supplier records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Title & Introduction */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
          <span>Dataset Profiling & Governance Report</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Data Quality & Integrity Insights
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Comprehensive profiling of the 1,000 supplier dataset (`veridia_csv.csv`).
          In accordance with senior product engineering principles, Veridia Match never assumes missing information satisfies buyer requirements and avoids unsafe fuzzy matching.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Total Records Analyzed
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {report.total_records.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1,000 unique entity names</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            ID Number Collisions
          </span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {report.id_collisions.length} Collision Keys
          </div>
          <p className="text-xs text-slate-500 mt-1">
            20 records share 10 duplicate IDs
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Missing Lead Times
          </span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {report.missing_lead_time_count} Records
          </div>
          <p className="text-xs text-slate-500 mt-1">
            1.0% missing both days and weeks
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Out-of-Bounds OTD Metric
          </span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {report.invalid_otd_pct_count} Records
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Values &gt; 100% clamped to 100%
          </p>
        </div>
      </div>

      {/* Section 1: Duplicate ID Collisions Audit */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              1. Disambiguation of Duplicate Manufacturer IDs (10 Collision Keys / 20 Distinct Companies)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <strong>Finding:</strong> Exactly 10 `manufacturer_id` values appear twice. Inspection demonstrates these are <strong>completely distinct legal businesses</strong> located in different cities with different names and capabilities (not duplicate rows).
            <br />
            <strong>Engineering Policy:</strong> Veridia Match retains the raw `manufacturer_id` for traceability while assigning deterministic synthetic keys (`record_id`), ensuring zero data loss and independent ranking for both companies.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Duplicate ID</th>
                <th className="py-2.5 px-3">Occurrences</th>
                <th className="py-2.5 px-3">Disambiguated Entities (Name, City, Capacity)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.id_collisions.map((col) => (
                <tr key={col.manufacturer_id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 font-mono font-bold text-amber-800">
                    {col.manufacturer_id}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {col.count} records
                  </td>
                  <td className="py-2 px-3 space-y-1">
                    {col.records.map((r) => (
                      <div key={r.record_id} className="flex items-center gap-2 text-slate-700">
                        <span className="font-semibold text-slate-900">{r.name}</span>
                        <span className="text-slate-400">•</span>
                        <span>{r.city}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-500">{r.capacity.toLocaleString()} units/mo</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Missing Lead Times Audit */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              2. Missing Lead Time Turnaround (10 Records / 1.0%)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <strong>Finding:</strong> 10 manufacturers have `null` / empty values for both `lead_time_days` and `lead_time_weeks`.
            <br />
            <strong>Engineering Policy:</strong> As mandated by the specification, <strong>never assume missing information satisfies a deadline</strong>. When a deadline is specified, these records are flagged with status <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono text-[11px]">NEEDS_VERIFICATION</code> rather than blindly accepting them.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {report.missing_lead_time_ids.map((id) => (
            <span
              key={id}
              className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-semibold"
            >
              {id} (Missing Lead Time)
            </span>
          ))}
        </div>
      </div>

      {/* Section 3: Out-of-Bounds Delivery Percentages */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              3. Out-of-Bounds Historical On-Time Delivery Rates (&gt; 100%)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <strong>Finding:</strong> 10 records have recorded `on_time_delivery_pct` exceeding 100.0% (e.g., 142.6%, 135.4%).
            <br />
            <strong>Engineering Policy:</strong> During Stage-2 scoring, the metric is mathematically clamped to 100.0% to prevent distortion of weighted rankings, while an explicit warning badge is surfaced on the manufacturer's audit card.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Manufacturer ID</th>
                <th className="py-2.5 px-3">Company Name</th>
                <th className="py-2.5 px-3">Recorded OTD %</th>
                <th className="py-2.5 px-3">Delivery Rating</th>
                <th className="py-2.5 px-3">Handling Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.invalid_otd_pct_records.map((r) => (
                <tr key={r.manufacturer_id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 font-mono font-bold text-slate-700">
                    {r.manufacturer_id}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {r.name}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-rose-600">
                    {r.on_time_delivery_pct}%
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      Tier {r.delivery_rating}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    Clamped to 100.0% + Audit Warning Flagged
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Architecture & Policy Governance */}
      <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Governance & Zero-Hallucination Principles</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-2">
          <div className="p-3 bg-navy-850 rounded-lg border border-navy-800 space-y-1">
            <h4 className="font-bold text-white">Strict Normalization</h4>
            <p className="text-slate-400 leading-relaxed">
              Canonical synonyms (e.g. Aluminum &rarr; Aluminium, CNC Machining &rarr; Milling/Turning) use strict, deterministic dictionaries. No unsafe probabilistic fuzzy matching.
            </p>
          </div>
          <div className="p-3 bg-navy-850 rounded-lg border border-navy-800 space-y-1">
            <h4 className="font-bold text-white">Deterministic Expiry</h4>
            <p className="text-slate-400 leading-relaxed">
              Evaluation date is frozen upon match creation. Expired certificates are strictly disqualified and never awarded points.
            </p>
          </div>
          <div className="p-3 bg-navy-850 rounded-lg border border-navy-800 space-y-1">
            <h4 className="font-bold text-white">Transparent Explanations</h4>
            <p className="text-slate-400 leading-relaxed">
              Every qualified supplier card returns itemized explanations and explicit warnings regarding export clearance to the buyer's destination country.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
