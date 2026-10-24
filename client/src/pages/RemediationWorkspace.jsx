import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import api from '../services/api.js';
import { SeverityBadge } from '../components/common/Badge.jsx';
import { CardSkeleton } from '../components/common/LoadingSkeleton.jsx';

export function RemediationWorkspace() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState('Open'); // For mobile tab toggle

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/findings?limit=100');
      if (res.data.success) {
        setFindings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load remediation findings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  const columns = [
    { id: 'Open', title: 'Open Backlog', color: 'border-rose-500/40 text-rose-500' },
    { id: 'In Progress', title: 'In Remediation', color: 'border-blue-500/40 text-blue-500' },
    { id: 'Fixed', title: 'Fixed & Verified', color: 'border-emerald-500/40 text-emerald-500' },
    { id: 'Accepted Risk', title: 'Accepted Risk', color: 'border-slate-500/40 text-slate-500' }
  ];

  const getFindingsByStatus = (status) => findings.filter((f) => f.status === status);

  const total = findings.length;
  const fixedCount = getFindingsByStatus('Fixed').length;
  const progressPercent = total > 0 ? Math.round((fixedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Remediation Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track and prioritize security issue resolution across your development lifecycle.
          </p>
        </div>

        {/* Global Remediation Progress Bar */}
        <div className="w-full sm:w-64 bg-white dark:bg-navy-900 p-3 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300">Remediation Progress</span>
            <span className="text-emerald-500 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colFindings = getFindingsByStatus(col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/70 dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 rounded-xl p-3 flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-navy-800 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-current ${col.color}`} />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                    {colFindings.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colFindings.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No issues in this column
                    </div>
                  ) : (
                    colFindings.map((f) => (
                      <div
                        key={f._id}
                        className="bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700/80 rounded-lg p-3.5 shadow-xs hover:border-blue-500/50 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <SeverityBadge severity={f.severity} size="xs" />
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {f.category}
                          </span>
                        </div>

                        <Link
                          to={`/app/findings/${f._id}`}
                          className="block text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-500 line-clamp-2"
                        >
                          {f.title}
                        </Link>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-navy-800">
                          <span className="font-mono truncate max-w-[120px]">
                            {f.targetId?.name}
                          </span>
                          <Link
                            to={`/app/findings/${f._id}`}
                            className="text-blue-500 font-semibold hover:underline inline-flex items-center gap-0.5"
                          >
                            Edit
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
