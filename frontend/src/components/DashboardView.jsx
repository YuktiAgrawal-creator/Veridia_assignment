import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Clock,
  Box,
  Layers,
  Wrench,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { fetchStats, fetchRecentMatches } from '../api/client';

export default function DashboardView({
  setActiveView,
  loadMatchRequest,
}) {
  const [stats, setStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        const [statsData, recentData] = await Promise.all([
          fetchStats(),
          fetchRecentMatches().catch(() => []),
        ]);
        setStats(statsData);
        setRecentMatches(recentData);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard metrics. Ensure backend API is running.');
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading precision manufacturing intelligence...</p>
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

  // Format processes for chart
  const processChartData = stats?.available_capabilities?.processes
    ? Object.entries(stats.available_capabilities.processes).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  // Format materials for chart
  const materialChartData = stats?.available_capabilities?.materials
    ? Object.entries(stats.available_capabilities.materials).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  const COLORS = ['#026fc7', '#0e8ce9', '#38a9f7', '#0358a1', '#7cc7fb', '#2563eb', '#1d4ed8', '#3b82f6', '#60a5fa'];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-850 rounded-xl p-6 md:p-8 text-white shadow-md border border-navy-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-medium border border-brand-500/30">
            <span>Precision Engineering Matchmaking Platform</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Connect with Audited Indian Manufacturers
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Submit international engineering RFQ criteria to identify, rank, and audit certified precision manufacturing partners with explainable qualification rules.
          </p>
        </div>
        <button
          onClick={() => setActiveView('builder')}
          className="shrink-0 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-3 rounded-lg text-sm transition-all shadow-md shadow-brand-600/30 hover:shadow-brand-600/50"
        >
          <span>Launch Requirement Builder</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Manufacturers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Network</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {stats?.total_manufacturers?.toLocaleString() || 1000}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audited precision workshops in India</span>
            </p>
          </div>
        </div>

        {/* Verified Certifications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Quality Certified</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {stats?.verified_certification_count?.toLocaleString() || 1000}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ISO 9001, AS9100, IATF 16949, ISO 13485
            </p>
          </div>
        </div>

        {/* Complete Records */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Complete Records</span>
            <div className="p-2 bg-blue-50 rounded-lg text-brand-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {stats?.complete_records_count?.toLocaleString() || 980}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <span>98.0% records with verified lead time & OTD</span>
            </p>
          </div>
        </div>

        {/* Geographic Clusters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Industrial Hubs</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              16 Cities / 10 States
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tamil Nadu, Gujarat, Maharashtra & more
            </p>
          </div>
        </div>
      </div>

      {/* Visual Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Manufacturing Process Capabilities (Supplier Registrations)
              </h3>
            </div>
            <span className="text-xs text-slate-500">9 Core Methods</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processChartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={90} />
                <Tooltip
                  formatter={(value) => [`${value} suppliers`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#026fc7" radius={[0, 4, 4, 0]}>
                  {processChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Materials Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Supported Engineering Raw Materials
              </h3>
            </div>
            <span className="text-xs text-slate-500">9 Materials</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialChartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={90} />
                <Tooltip
                  formatter={(value) => [`${value} suppliers`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0e8ce9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Matchmaking Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-800 text-sm">Recent Matchmaking Requests</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">SQLite Persistent History</span>
        </div>

        {recentMatches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No matching runs yet. Use the Requirement Builder to submit your first RFQ.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Process</th>
                  <th className="py-3 px-4">Volume</th>
                  <th className="py-3 px-4">Certification</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Eligible</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMatches.map((m) => (
                  <tr key={m.request_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                      {m.request_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 capitalize">
                      {m.material}
                    </td>
                    <td className="py-3 px-4 text-slate-700 capitalize">
                      {m.process}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      {m.quantity?.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 border border-slate-200">
                        {m.certification || 'Any'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {m.destination_country}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {m.total_eligible}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => loadMatchRequest(m.request_id)}
                        className="text-brand-600 hover:text-brand-800 font-semibold hover:underline"
                      >
                        Load Results →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
