import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import api from '../services/api.js';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { TableSkeleton } from '../components/common/LoadingSkeleton.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';

export function FindingsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [findings, setFindings] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1 });

  // Query state from URL search params
  const search = searchParams.get('search') || '';
  const severity = searchParams.get('severity') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const targetId = searchParams.get('targetId') || '';

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const fetchFindings = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams);
      params.set('page', page);
      params.set('limit', '15');

      const [findingsRes, targetsRes] = await Promise.all([
        api.get(`/findings?${params.toString()}`),
        api.get('/targets')
      ]);

      if (findingsRes.data.success) {
        setFindings(findingsRes.data.data);
        setPagination(findingsRes.data.pagination);
      }
      if (targetsRes.data.success) {
        setTargets(targetsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load findings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security Findings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Prioritized inventory of observed misconfigurations across all authorized applications.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-3.5 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, rule ID (e.g. CSP, HSTS)..."
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Target Filter */}
          <div className="w-full sm:w-56">
            <select
              value={targetId}
              onChange={(e) => updateParam('targetId', e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">All Targets</option>
              {targets.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mr-1">
            Severity:
          </span>
          {['', 'Critical', 'High', 'Medium', 'Low', 'Informational'].map((s) => (
            <button
              key={s}
              onClick={() => updateParam('severity', s)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                severity === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-navy-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}

          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider ml-4 mr-1">
            Status:
          </span>
          {['', 'Open', 'In Progress', 'Fixed', 'Accepted Risk', 'False Positive'].map((st) => (
            <button
              key={st}
              onClick={() => updateParam('status', st)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                status === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-navy-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : findings.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No findings matched"
            description="Try clearing search filters or launching a new assessment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-navy-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-navy-800">
                  <th className="py-2.5 px-4 font-semibold">Severity</th>
                  <th className="py-2.5 px-4 font-semibold">Finding Title & Rule ID</th>
                  <th className="py-2.5 px-4 font-semibold">Target Application</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">First Detected</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {findings.map((f) => (
                  <tr
                    key={f._id}
                    className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <SeverityBadge severity={f.severity} size="xs" />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <Link
                        to={`/app/findings/${f._id}`}
                        className="hover:text-blue-500 font-semibold block"
                      >
                        {f.title}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {f.ruleId} • {f.normalizedEndpoint}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{f.targetId?.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {f.targetId?.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-400">
                      {f.category}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={f.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(f.firstDetectedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/findings/${f._id}`}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Remediate
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => updateParam('page', String(pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="p-1 rounded bg-slate-100 dark:bg-navy-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateParam('page', String(pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1 rounded bg-slate-100 dark:bg-navy-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
