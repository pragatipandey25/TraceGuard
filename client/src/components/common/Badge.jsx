import React from 'react';

export function SeverityBadge({ severity, size = 'sm' }) {
  const styles = {
    Critical: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40',
    High: 'bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40',
    Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    Low: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
    Informational: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
  };

  const currentStyle = styles[severity] || styles.Informational;
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded border ${padding} ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {severity}
    </span>
  );
}

export function StatusBadge({ status, size = 'sm' }) {
  const styles = {
    Open: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Fixed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'Accepted Risk': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    'False Positive': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    queued: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    running: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 animate-pulse',
    completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    completed_with_errors: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    cancelled: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  };

  const currentStyle = styles[status] || styles.Open;
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded border ${padding} ${currentStyle}`}>
      {status}
    </span>
  );
}
