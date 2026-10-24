import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  GitCompare,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Shield,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api.js';
import { StatusBadge } from '../components/common/Badge.jsx';
import { TableSkeleton } from '../components/common/LoadingSkeleton.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';

export function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [targetFilter, setTargetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targets, setTargets] = useState([]);

  // Comparison selection: array of up to 2 assessment IDs
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [compareError, setCompareError] = useState('');
  const navigate = useNavigate();

  const fetchAssessments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (targetFilter) params.append('targetId', targetFilter);
      if (statusFilter) params.append('status', statusFilter);

      const [assessRes, targetsRes] = await Promise.all([
        api.get(`/assessments?${params.toString()}`),
        api.get('/targets')
      ]);

      if (assessRes.data.success) {
        setAssessments(assessRes.data.data);
        setPagination(assessRes.data.pagination);
      }
      if (targetsRes.data.success) {
        setTargets(targetsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load assessments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments(1);
  }, [targetFilter, statusFilter]);

  const toggleSelectForCompare = (a) => {
    setCompareError('');
    if (selectedForCompare.includes(a._id)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== a._id));
      return;
    }

    if (selectedForCompare.length === 2) {
      setCompareError('You can compare a maximum of 2 assessments at a time.');
      return;
    }

    if (selectedForCompare.length === 1) {
      const first = assessments.find((x) => x._id === selectedForCompare[0]);
      if (first && first.targetId?._id !== a.targetId?._id) {
        setCompareError('Both assessments must target the same application to be compared.');
        return;
      }
    }

    setSelectedForCompare([...selectedForCompare, a._id]);
  };

  const handleExecuteCompare = () => {
    if (selectedForCompare.length !== 2) {
      setCompareError('Please select exactly two assessments of the same target to compare.');
      return;
    }
    navigate(`/app/assessments/compare?firstId=${selectedForCompare[0]}&secondId=${selectedForCompare[1]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Assessment History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit logs and diff comparisons across completed security assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedForCompare.length > 0 && (
            <button
              onClick={handleExecuteCompare}
              disabled={selectedForCompare.length !== 2}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare ({selectedForCompare.length}/2)
            </button>
          )}

          <Link
            to="/app/assessments/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </Link>
        </div>
      </div>

      {compareError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
          {compareError}
        </div>
      )}

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-3 rounded-xl shadow-xs">
        <div className="w-full sm:w-64">
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Targets</option>
            {targets.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.baseUrl})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="completed_with_errors">With Warnings</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {selectedForCompare.length > 0 && (
          <button
            onClick={() => setSelectedForCompare([])}
            className="ml-auto text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline"
          >
            Clear Compare Selection
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : assessments.length === 0 ? (
          <EmptyState
            icon={History}
            title="No assessments found"
            description="No assessment records match the current filter criteria."
            actionLabel="Start New Assessment"
            actionLink="/app/assessments/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-navy-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-navy-800">
                  <th className="py-2.5 px-4 font-semibold w-10">Compare</th>
                  <th className="py-2.5 px-4 font-semibold">Target Application</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Findings</th>
                  <th className="py-2.5 px-4 font-semibold">Posture Score</th>
                  <th className="py-2.5 px-4 font-semibold">Duration</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {assessments.map((a) => {
                  const isChecked = selectedForCompare.includes(a._id);
                  return (
                    <tr
                      key={a._id}
                      className={`hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors ${
                        isChecked ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectForCompare(a)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          title="Select to compare"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        <div>{a.targetId?.name || 'Target'}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {a.targetId?.baseUrl}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.status} size="xs" />
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {a.summary?.totalFindings || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {a.summary?.postureScore ?? 100}/100
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {a.durationMs}ms
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
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Scan
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchAssessments(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1 rounded bg-slate-100 dark:bg-navy-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchAssessments(pagination.page + 1)}
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
