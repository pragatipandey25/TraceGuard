import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Download,
  FileText,
  AlertOctagon,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import api from '../services/api.js';
import { ScoreDial } from '../components/common/ScoreDial.jsx';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { CardSkeleton } from '../components/common/LoadingSkeleton.jsx';

export function AssessmentDetail() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'checks'
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const pollIntervalRef = useRef(null);

  const fetchAssessment = async () => {
    try {
      const [assessRes, findingsRes] = await Promise.all([
        api.get(`/assessments/${id}`),
        api.get(`/assessments/${id}/findings`)
      ]);
      if (assessRes.data.success) {
        setAssessment(assessRes.data.data);
      }
      if (findingsRes.data.success) {
        setFindings(findingsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching assessment', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();

    // Set up polling while scan is running
    pollIntervalRef.current = setInterval(() => {
      if (assessment && (assessment.status === 'queued' || assessment.status === 'running')) {
        fetchAssessment();
      }
    }, 1500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [id, assessment?.status]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this ongoing assessment?')) return;
    setCancelling(true);
    try {
      await api.post(`/assessments/${id}/cancel`);
      await fetchAssessment();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel scan');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-navy-800 rounded animate-pulse" />
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-8 text-center text-slate-500">
        Assessment record not found.
      </div>
    );
  }

  const isRunning = assessment.status === 'queued' || assessment.status === 'running';

  const filteredFindings = findings.filter((f) => {
    if (selectedSeverity === 'ALL') return true;
    return f.severity === selectedSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/app/assessments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Assessment History
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assessment Results
            </h1>
            <StatusBadge status={assessment.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Target: <span className="font-semibold text-slate-700 dark:text-slate-200">{assessment.targetId?.name}</span>{' '}
            (<span className="font-mono">{assessment.targetId?.baseUrl}</span>)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {isRunning ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? 'Cancelling...' : 'Cancel Scan'}
            </button>
          ) : (
            <>
              <a
                href={`/api/reports/${assessment._id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-navy-850 hover:bg-slate-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </a>
              <a
                href={`/api/reports/${assessment._id}/json`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-navy-850 hover:bg-slate-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Export JSON
              </a>
            </>
          )}
        </div>
      </div>

      {/* Live Scan Progress Banner */}
      {isRunning && (
        <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Assessment In Progress ({assessment.progress}%)
            </span>
            <span className="text-xs font-mono text-slate-500">
              Elapsed: {Math.round((Date.now() - new Date(assessment.startedAt || assessment.createdAt).getTime()) / 1000)}s
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-navy-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(5, assessment.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Assessment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Posture Dial */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 flex flex-col items-center justify-center shadow-xs">
          <ScoreDial score={assessment.summary?.postureScore ?? 100} />
        </div>

        {/* Total Findings Breakdown */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Discovered Findings
          </span>
          <div className="my-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {assessment.summary?.totalFindings || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Identified misconfigurations</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-navy-800 text-[11px] font-mono">
            <span className="text-red-500 font-semibold">{assessment.summary?.criticalCount || 0} Crit</span>
            <span className="text-slate-300 dark:text-navy-700">•</span>
            <span className="text-orange-500 font-semibold">{assessment.summary?.highCount || 0} High</span>
            <span className="text-slate-300 dark:text-navy-700">•</span>
            <span className="text-amber-500 font-semibold">{assessment.summary?.mediumCount || 0} Med</span>
            <span className="text-slate-300 dark:text-navy-700">•</span>
            <span className="text-blue-500 font-semibold">{assessment.summary?.lowCount || 0} Low</span>
          </div>
        </div>

        {/* Checks Evaluated */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Check Results
          </span>
          <div className="my-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {assessment.summary?.totalChecks || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Audited modules</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800 text-xs">
            <span className="text-emerald-500 font-semibold">{assessment.summary?.passedChecks || 0} passed</span>
            <span className="text-slate-300 dark:text-navy-700">•</span>
            <span className="text-red-500 font-semibold">{assessment.summary?.failedChecks || 0} failed</span>
          </div>
        </div>

        {/* Execution Metadata */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Execution Details
          </span>
          <div className="my-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Duration:</span>
              <span className="font-mono font-medium text-slate-900 dark:text-white">
                {assessment.durationMs}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Environment:</span>
              <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                {assessment.targetId?.environment}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Completed:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {assessment.completedAt ? new Date(assessment.completedAt).toLocaleTimeString() : 'Running...'}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 text-[11px] text-slate-400">
            Non-intrusive heuristic audit
          </div>
        </div>
      </div>

      {/* Tabs navigation: Findings vs Checks */}
      <div className="border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('findings')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'findings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Findings Discovered ({findings.length})
          </button>
          <button
            onClick={() => setActiveTab('checks')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'checks'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Checks Log ({assessment.checkResults?.length || 0})
          </button>
        </div>

        {/* Severity Filter pills when on findings tab */}
        {activeTab === 'findings' && (
          <div className="flex items-center gap-1.5 pb-2 overflow-x-auto text-xs">
            {['ALL', 'Critical', 'High', 'Medium', 'Low', 'Informational'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-navy-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Findings Table */}
      {activeTab === 'findings' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No findings matched the selected severity filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-800">
              {filteredFindings.map((f) => (
                <div
                  key={f._id}
                  className="p-5 hover:bg-slate-50 dark:hover:bg-navy-850/50 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={f.severity} />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {f.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[10px] text-slate-400">{f.ruleId}</span>
                      <StatusBadge status={f.status} size="xs" />
                      <Link
                        to={`/app/findings/${f._id}`}
                        className="ml-2 font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Inspect & Remediate
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {f.description}
                  </p>

                  {/* Remediation Snippet */}
                  {f.remediation?.configSnippet && (
                    <div className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg overflow-x-auto border border-slate-800">
                      <code>{f.remediation.configSnippet}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Checks Summary Table */}
      {activeTab === 'checks' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-navy-800">
                <th className="py-2.5 px-4 font-semibold">Check Module</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Duration</th>
                <th className="py-2.5 px-4 font-semibold">Result Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {(assessment.checkResults || []).map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-navy-800/50">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-400">
                    {c.category}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'passed'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : c.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {c.durationMs}ms
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {c.message || (c.error ? <span className="text-red-400">{c.error}</span> : 'Completed')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
