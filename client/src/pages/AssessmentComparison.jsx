import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import api from '../services/api.js';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { CardSkeleton } from '../components/common/LoadingSkeleton.jsx';

export function AssessmentComparison() {
  const [searchParams] = useSearchParams();
  const firstId = searchParams.get('firstId');
  const secondId = searchParams.get('secondId');

  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'resolved' | 'recurring' | 'unchanged'

  useEffect(() => {
    async function loadComparison() {
      if (!firstId || !secondId) {
        setError('Comparison requires both firstId and secondId parameters.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get(`/assessments/compare?firstId=${firstId}&secondId=${secondId}`);
        if (res.data.success) {
          setComparison(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to compare assessments.');
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [firstId, secondId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-navy-800 rounded animate-pulse" />
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to History
        </Link>
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
          {error || 'Unable to load comparison.'}
        </div>
      </div>
    );
  }

  const { baseline, comparison: compScan, deltaScore, counts, target } = comparison;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/app/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Assessment History
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assessment Comparison & Diff
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target: <span className="font-semibold">{target.name}</span> ({target.baseUrl})
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baseline Card */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Baseline Scan
          </span>
          <p className="text-xs font-mono text-slate-500 mt-1">
            {new Date(baseline.date).toLocaleDateString()}
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {baseline.postureScore}/100
              </span>
              <p className="text-[11px] text-slate-400">Posture Score</p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {baseline.totalFindings} findings
            </span>
          </div>
        </div>

        {/* Delta Card */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs flex flex-col justify-between items-center text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Posture Delta
          </span>
          <div className="my-2 flex items-center gap-1.5">
            {deltaScore > 0 ? (
              <>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl font-bold font-mono text-emerald-500">
                  +{deltaScore} pts
                </span>
              </>
            ) : deltaScore < 0 ? (
              <>
                <TrendingDown className="w-5 h-5 text-rose-500" />
                <span className="text-2xl font-bold font-mono text-rose-500">
                  {deltaScore} pts
                </span>
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-bold font-mono text-slate-400">
                  0 pts
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {deltaScore > 0 ? 'Security posture improved' : deltaScore < 0 ? 'Security regressions detected' : 'No posture change'}
          </p>
        </div>

        {/* Comparison Scan Card */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Recent Comparison Scan
          </span>
          <p className="text-xs font-mono text-slate-500 mt-1">
            {new Date(compScan.date).toLocaleDateString()}
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {compScan.postureScore}/100
              </span>
              <p className="text-[11px] text-slate-400">Posture Score</p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {compScan.totalFindings} findings
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-navy-800 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('new')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'new'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Newly Detected ({counts.newCount})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'resolved'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Resolved / Fixed ({counts.resolvedCount})
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'recurring'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Recurring ({counts.recurringCount})
        </button>
        <button
          onClick={() => setActiveTab('unchanged')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'unchanged'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Unchanged ({counts.unchangedCount})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
        {activeTab === 'new' && (
          <FindingDiffList
            items={comparison.newFindings}
            emptyMessage="No new findings introduced between these two assessments."
            tagColor="text-red-500"
            tagLabel="NEW REGRESSION"
          />
        )}
        {activeTab === 'resolved' && (
          <FindingDiffList
            items={comparison.resolvedFindings}
            emptyMessage="No findings were resolved between these two assessments."
            tagColor="text-emerald-500"
            tagLabel="FIXED & RESOLVED"
          />
        )}
        {activeTab === 'recurring' && (
          <FindingDiffList
            items={comparison.recurringFindings}
            emptyMessage="No recurring findings detected."
            tagColor="text-amber-500"
            tagLabel="RECURRING"
          />
        )}
        {activeTab === 'unchanged' && (
          <FindingDiffList
            items={comparison.unchangedFindings}
            emptyMessage="No unchanged findings."
            tagColor="text-slate-500"
            tagLabel="PERSISTENT"
          />
        )}
      </div>
    </div>
  );
}

function FindingDiffList({ items, emptyMessage, tagColor, tagLabel }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-navy-800">
      {items.map((f) => (
        <div key={f._id} className="p-5 space-y-2 hover:bg-slate-50 dark:hover:bg-navy-850/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={f.severity} />
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                {f.title}
              </h4>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${tagColor}`}>
              {tagLabel}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {f.description}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="font-mono">{f.ruleId}</span>
            <Link
              to={`/app/findings/${f._id}`}
              className="text-blue-500 hover:underline font-semibold"
            >
              View Full Finding & Remediation →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
