import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  Send,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  RotateCcw,
  Zap
} from 'lucide-react';
import { fetchFilterOptions, submitMatchRequest, parseNaturalLanguageRFQ } from '../api/client';

export default function RequirementBuilderView({
  onMatchSuccess,
  setActiveView,
}) {
  const [filters, setFilters] = useState(null);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Form state
  const [material, setMaterial] = useState('aluminium');
  const [process, setProcess] = useState('CNC machining');
  const [quantity, setQuantity] = useState(1000);
  const [certification, setCertification] = useState('ISO 9001');
  const [deadlineDays, setDeadlineDays] = useState(42);
  const [destinationCountry, setDestinationCountry] = useState('United States');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().slice(0, 10));

  // AI RFQ Parser state
  const [showAiParser, setShowAiParser] = useState(false);
  const [rfqText, setRfqText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    async function loadFilters() {
      try {
        setLoadingFilters(true);
        const data = await fetchFilterOptions();
        setFilters(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFilters(false);
      }
    }
    loadFilters();
  }, []);

  // Presets from assignment specifications
  const applyPresetA = () => {
    setMaterial('aluminium');
    setProcess('CNC machining');
    setQuantity(1000);
    setCertification('ISO 9001');
    setDeadlineDays(42);
    setDestinationCountry('United States');
    setFormError(null);
  };

  const applyPresetB = () => {
    setMaterial('stainless steel');
    setProcess('sheet metal');
    setQuantity(1500);
    setCertification('ISO 9001');
    setDeadlineDays(42);
    setDestinationCountry('Germany');
    setFormError(null);
  };

  const handleAiParse = async (e) => {
    e.preventDefault();
    if (!rfqText.trim()) return;

    try {
      setAiParsing(true);
      setAiMessage(null);
      const res = await parseNaturalLanguageRFQ(rfqText);
      if (res && res.parsed_requirements) {
        const p = res.parsed_requirements;
        if (p.material) setMaterial(p.material);
        if (p.process) setProcess(p.process);
        if (p.quantity) setQuantity(p.quantity);
        if (p.certification !== undefined) setCertification(p.certification || '');
        if (p.delivery_deadline_days) setDeadlineDays(p.delivery_deadline_days);
        if (p.destination_country) setDestinationCountry(p.destination_country);

        setAiMessage({
          type: 'success',
          text: 'RFQ parsed into structured fields. Review and click "Find Matching Manufacturers".',
        });
      }
    } catch (err) {
      setAiMessage({
        type: 'error',
        text: 'Failed to parse natural language RFQ. You can fill the form fields manually.',
      });
    } finally {
      setAiParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!material) {
      setFormError('Please select a target material.');
      return;
    }
    if (!process) {
      setFormError('Please select a manufacturing process.');
      return;
    }
    if (!quantity || quantity <= 0) {
      setFormError('Required quantity must be a positive number.');
      return;
    }
    if (!deadlineDays || deadlineDays <= 0) {
      setFormError('Delivery deadline must be at least 1 day.');
      return;
    }
    if (!destinationCountry) {
      setFormError('Please specify the destination country.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        material,
        process,
        quantity: parseInt(quantity, 10),
        certification: certification || null,
        delivery_deadline_days: parseInt(deadlineDays, 10),
        destination_country: destinationCountry,
        evaluation_date: evaluationDate || null,
      };

      const matchResponse = await submitMatchRequest(payload);
      onMatchSuccess(matchResponse);
      setActiveView('results');
    } catch (err) {
      setFormError(err.message || 'Error occurred while evaluating matchmaking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header & Preset Switchers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Procurement Requirement Builder
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Specify technical parameters to run Stage-1 hard eligibility and Stage-2 weighted ranking.
          </p>
        </div>

        {/* Quick Test Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Test Presets:</span>
          <button
            type="button"
            onClick={applyPresetA}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded border border-slate-300 transition-colors"
          >
            Buyer A (Aluminium CNC)
          </button>
          <button
            type="button"
            onClick={applyPresetB}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded border border-slate-300 transition-colors"
          >
            Buyer B (Stainless Sheet)
          </button>
        </div>
      </div>

      {/* AI RFQ Parser Accordion */}
      <div className="bg-brand-50/50 border border-brand-200/80 rounded-xl p-4 transition-all">
        <button
          type="button"
          onClick={() => setShowAiParser(!showAiParser)}
          className="w-full flex items-center justify-between text-left text-xs font-semibold text-brand-900"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>AI RFQ Assistant — Paste Natural Language Requirements</span>
          </div>
          <span className="text-brand-600 text-[11px] underline">
            {showAiParser ? 'Hide Assistant' : 'Show Assistant'}
          </span>
        </button>

        {showAiParser && (
          <form onSubmit={handleAiParse} className="mt-3 space-y-2.5 pt-2 border-t border-brand-200/60">
            <textarea
              value={rfqText}
              onChange={(e) => setRfqText(e.target.value)}
              placeholder="e.g. Need 1,000 units of aluminium parts made with CNC machining under ISO 9001 required within 42 days shipped to USA"
              rows={2}
              className="w-full p-2.5 text-xs bg-white border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Rule-based deterministic NLP extracts material, process, volume, cert, deadline & destination.
              </span>
              <button
                type="submit"
                disabled={aiParsing || !rfqText.trim()}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
              >
                {aiParsing ? 'Parsing...' : 'Populate Form'}
              </button>
            </div>
            {aiMessage && (
              <p className={`text-xs ${aiMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'} font-medium`}>
                {aiMessage.text}
              </p>
            )}
          </form>
        )}
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Requirement Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Material */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Engineering Material <span className="text-rose-500">*</span>
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
            >
              <option value="aluminium">Aluminium (Aluminum)</option>
              <option value="stainless steel">Stainless Steel (SS)</option>
              <option value="mild steel">Mild Steel (MS / Carbon)</option>
              <option value="brass">Brass</option>
              <option value="copper">Copper</option>
              <option value="titanium">Titanium</option>
              <option value="ABS">ABS Polymer</option>
              <option value="nylon">Nylon (Polyamide)</option>
              <option value="cast iron">Cast Iron</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Validated against supplier certified raw materials portfolio.
            </p>
          </div>

          {/* Manufacturing Process */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Manufacturing Process <span className="text-rose-500">*</span>
            </label>
            <select
              value={process}
              onChange={(e) => setProcess(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
            >
              <option value="CNC machining">CNC Machining (Milling & Turning)</option>
              <option value="CNC milling">CNC Milling</option>
              <option value="CNC turning">CNC Turning (Lathe)</option>
              <option value="sheet metal">Sheet Metal Fabrication</option>
              <option value="injection moulding">Injection Moulding</option>
              <option value="EDM">EDM (Electrical Discharge Machining)</option>
              <option value="casting">Metal Casting</option>
              <option value="forging">Forging</option>
              <option value="welding">Welding / Fabrication</option>
              <option value="grinding">Precision Grinding</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Matches core competencies and multi-process workshop capabilities.
            </p>
          </div>

          {/* Required Quantity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Required Volume (Units) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={1000000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all font-mono"
              placeholder="e.g. 1000"
            />
            <p className="text-[11px] text-slate-500">
              Evaluated against supplier monthly capacity & MOQ bounds.
            </p>
          </div>

          {/* Quality Certification */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Required Quality Certification
            </label>
            <select
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
            >
              <option value="ISO 9001">ISO 9001 (Quality Management)</option>
              <option value="AS9100">AS9100 (Aerospace & Defense)</option>
              <option value="IATF 16949">IATF 16949 (Automotive Standard)</option>
              <option value="ISO 13485">ISO 13485 (Medical Devices)</option>
              <option value="ISO 14001">ISO 14001 (Environmental Management)</option>
              <option value="">No Mandatory Standard (Any)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Evaluated against fixed evaluation date using strict expiry logic.
            </p>
          </div>

          {/* Delivery Deadline */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Max Delivery Deadline (Days) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all font-mono"
              placeholder="e.g. 42"
            />
            <p className="text-[11px] text-slate-500">
              Unverified supplier lead times trigger NEEDS_VERIFICATION status.
            </p>
          </div>

          {/* Destination Country */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Destination Country <span className="text-rose-500">*</span>
            </label>
            <select
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all"
            >
              <option value="United States">United States</option>
              <option value="Germany">Germany</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Japan">Japan</option>
              <option value="Netherlands">Netherlands</option>
              <option value="France">France</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Italy">Italy</option>
              <option value="Singapore">Singapore</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Suppliers in India; export history checked & compliance flagged.
            </p>
          </div>
        </div>

        {/* Advanced Section: Fixed Evaluation Date for Certification Expiry */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-semibold">Deterministic Evaluation Date (Expiry Benchmark):</span>
            </div>
            <input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Certificates must satisfy: issue_date &le; evaluation_date &le; expiry_date. Results are frozen at this date.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-md shadow-brand-600/20"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Match Engine...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Find Matching Manufacturers</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
