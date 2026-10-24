import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Shield,
  Clock,
  Layers,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import api from '../services/api.js';
import { StatusBadge } from '../components/common/Badge.jsx';
import { TableSkeleton } from '../components/common/LoadingSkeleton.jsx';

export function ReportsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await api.get('/assessments?status=completed&limit=50');
        if (res.data.success) {
          setAssessments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Security Reports & Compliance Exports
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Generate executive PDF summaries and structured JSON audit records.
        </p>
      </div>

      {/* Scope and Disclaimer Box */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Shield className="w-4 h-4 text-blue-500" />
          <span>Report Scope & Security Methodology</span>
        </div>
        <p className="leading-relaxed">
          TraceGuard reports document passive, non-intrusive configuration checks (Security Headers, TLS Handshakes, Cookie Directives, CORS policies, and Redirect integrity). Reports do not include passwords, authorization tokens, or internal environment secrets. Automated baseline assessments do not replace periodic manual penetration testing.
        </p>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Available Assessment Reports ({assessments.length})
          </h2>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : assessments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No completed assessments available for report generation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-navy-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-navy-800">
                  <th className="py-2.5 px-4 font-semibold">Target Application</th>
                  <th className="py-2.5 px-4 font-semibold">Environment</th>
                  <th className="py-2.5 px-4 font-semibold">Findings Identified</th>
                  <th className="py-2.5 px-4 font-semibold">Posture Score</th>
                  <th className="py-2.5 px-4 font-semibold">Assessment Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {assessments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div>{a.targetId?.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {a.targetId?.baseUrl}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-400">
                      {a.targetId?.environment}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {a.summary?.totalFindings || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {a.summary?.postureScore ?? 100}/100
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <a
                        href={`/api/reports/${a._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </a>
                      <a
                        href={`/api/reports/${a._id}/json`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        JSON
                      </a>
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
