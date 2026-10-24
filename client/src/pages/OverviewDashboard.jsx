import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import api from '../services/api.js';
import { ScoreDial } from '../components/common/ScoreDial.jsx';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { CardSkeleton } from '../components/common/LoadingSkeleton.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';

export function OverviewDashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [sumRes, trendRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/trends')
        ]);
        if (sumRes.data.success) setSummary(sumRes.data.data);
        if (trendRes.data.success) setTrends(trendRes.data.data);
      } catch (err) {
        setError('Failed to fetch dashboard metrics. Please ensure backend is running.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-navy-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
        {error}
      </div>
    );
  }

  // Handle zero assessments empty state
  if (!summary || summary.totalAssessments === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Security Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Welcome to TraceGuard. Set up your first authorized target to begin assessing security posture.
            </p>
          </div>
        </div>
        <EmptyState
          icon={ShieldCheck}
          title="No assessments completed yet"
          description="Register an authorized web application target to run automated configuration audits (Headers, TLS, Cookies, CORS, and redirects)."
          actionLabel="Launch First Assessment"
          actionLink="/app/assessments/new"
        />
      </div>
    );
  }

  const sevColors = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#3b82f6',
    Informational: '#10b981'
  };

  const severityPieData = Object.entries(summary.severityCounts || {})
    .filter(([_, count]) => count > 0)
    .map(([sev, count]) => ({
      name: sev,
      value: count,
      color: sevColors[sev] || '#64748b'
    }));

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time vulnerability findings and posture heuristic across authorized targets.
          </p>
        </div>
        <Link
          to="/app/assessments/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Start New Assessment
        </Link>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Posture Score Dial Card */}
        <div className="sm:col-span-2 lg:col-span-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Security Posture
            </span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-auto py-2">
            <ScoreDial score={summary.postureScore} />
          </div>
        </div>

        {/* Total Assessments */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Assessments
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {summary.totalAssessments}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {summary.completedAssessments} scans completed
            </p>
          </div>
        </div>

        {/* Open Findings */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Open Findings
            </span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {summary.openFindingsCount}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-red-500 font-medium font-mono">
                {summary.severityCounts?.Critical || 0} Critical
              </span>
              <span className="text-[11px] text-orange-500 font-medium font-mono">
                {summary.severityCounts?.High || 0} High
              </span>
            </div>
          </div>
        </div>

        {/* Resolved Findings */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Remediated / Fixed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summary.resolvedFindingsCount}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Verified fixes over time
            </p>
          </div>
        </div>

        {/* Monitored Targets */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Authorized Targets
            </span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {summary.totalTargets}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Active target applications
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posture Trend / Findings Over Time */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Posture Score Trend
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Historical score progression across recent completed assessments
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            {trends?.timeline && trends.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b820" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="postureScore"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                    name="Posture Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Run more assessments to view historical posture trends.
              </div>
            )}
          </div>
        </div>

        {/* Severity Distribution Donut */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Findings by Severity
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Current open risk distribution
              </p>
            </div>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            {severityPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No open findings to display</p>
            )}
          </div>
          {/* Legend */}
          <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
            {Object.entries(summary.severityCounts || {}).map(([sev, count]) => (
              <div key={sev} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sevColors[sev] || '#64748b' }}
                  />
                  <span className="text-slate-600 dark:text-slate-300">{sev}</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assessment Activity Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Assessment Activity
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Latest execution runs across your authorized applications
            </p>
          </div>
          <Link
            to="/app/assessments"
            className="text-xs font-semibold text-blue-500 hover:text-blue-600 inline-flex items-center gap-1"
          >
            View All History
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-navy-800">
                <th className="py-2.5 px-4 font-semibold">Target Application</th>
                <th className="py-2.5 px-4 font-semibold">Environment</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Findings Identified</th>
                <th className="py-2.5 px-4 font-semibold">Posture Score</th>
                <th className="py-2.5 px-4 font-semibold">Executed At</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {summary.recentAssessments && summary.recentAssessments.length > 0 ? (
                summary.recentAssessments.map((a) => (
                  <tr
                    key={a._id}
                    className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div>{a.targetId?.name || 'Target'}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {a.targetId?.baseUrl}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] uppercase font-semibold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                        {a.targetId?.environment || 'prod'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={a.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {a.summary?.totalFindings || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({a.summary?.criticalCount || 0} crit, {a.summary?.highCount || 0} high)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {a.summary?.postureScore ?? 100}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/assessments/${a._id}`}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    No recent assessments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
