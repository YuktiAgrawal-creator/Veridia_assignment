import React from 'react';
import {
  X,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
  Box,
  Truck,
  ExternalLink,
  Mail,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function SupplierModal({ supplier, onClose, destinationCountry }) {
  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/70 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {supplier.manufacturer_id}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  supplier.status === 'ELIGIBLE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : supplier.status === 'NEEDS_VERIFICATION'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {supplier.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{supplier.name}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{supplier.full_address}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Match Score & Breakdown Card */}
          <div className="bg-brand-50/50 border border-brand-200 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-200/60">
              <div>
                <span className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                  Composite Match Compatibility
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Calculated using transparent 4-factor multi-criteria model
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-brand-700">
                  {supplier.match_score}
                </span>
                <span className="text-xs text-slate-500 font-semibold"> / 100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-center">
              <div className="p-2 bg-white rounded-lg border border-brand-100">
                <span className="text-[10px] text-slate-500 font-medium">Delivery (35%)</span>
                <p className="text-sm font-bold text-slate-800">
                  {supplier.score_breakdown?.delivery_suitability} / 35
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-brand-100">
                <span className="text-[10px] text-slate-500 font-medium">Capacity (30%)</span>
                <p className="text-sm font-bold text-slate-800">
                  {supplier.score_breakdown?.capacity_suitability} / 30
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-brand-100">
                <span className="text-[10px] text-slate-500 font-medium">Certification (20%)</span>
                <p className="text-sm font-bold text-slate-800">
                  {supplier.score_breakdown?.certification_quality} / 20
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-brand-100">
                <span className="text-[10px] text-slate-500 font-medium">Track Record (15%)</span>
                <p className="text-sm font-bold text-slate-800">
                  {supplier.score_breakdown?.track_record} / 15
                </p>
              </div>
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Audited Operational Capabilities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 text-[11px]">Monthly Capacity:</span>
                <p className="font-bold text-slate-800 text-sm">
                  {supplier.capacity_units_per_month?.toLocaleString()} units
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">MOQ - Max Order:</span>
                <p className="font-bold text-slate-800 text-sm">
                  {supplier.min_order_qty?.toLocaleString()} - {supplier.max_order_qty?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Lead Time:</span>
                <p className="font-bold text-slate-800 text-sm">
                  {supplier.lead_time_days ? `${supplier.lead_time_days} days (${supplier.lead_time_weeks} wks)` : 'Unrecorded (Needs Verif.)'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">On-Time Delivery Rate:</span>
                <p className="font-bold text-slate-800 text-sm">
                  {supplier.on_time_delivery_pct}% (Rating: {supplier.delivery_rating})
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Export Experience:</span>
                <p className="font-bold text-slate-800 text-sm">
                  {supplier.export_experience_years} years
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Company Scale:</span>
                <p className="font-bold text-slate-800 text-sm">
                  {supplier.company_size} Enterprise
                </p>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Supported Materials
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {supplier.materials.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Processes & Specialties
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {supplier.processes.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                    {p} {p === supplier.primary_process && '★ (Primary)'}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Certifications & Audit Dates
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {supplier.certifications.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{c}</span>
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex gap-4">
                <span>Expires: <strong className="text-slate-700 font-mono">{supplier.certification_expiry || 'Unrecorded'}</strong></span>
                <span>Last Audited: <strong className="text-slate-700 font-mono">{supplier.last_audit_date || 'Unrecorded'}</strong></span>
              </div>
            </div>
          </div>

          {/* Why Matched Section */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Why This Manufacturer Qualified</span>
            </h4>
            <ul className="space-y-1.5 bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl text-emerald-950">
              {supplier.reasons?.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Warnings & Missing Info */}
          {supplier.warnings?.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Warnings & Independent Verifications Required</span>
              </h4>
              <ul className="space-y-1.5 bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl text-amber-950">
                {supplier.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Details */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-600">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{supplier.contact_email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>{supplier.website}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors self-end sm:self-auto"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
