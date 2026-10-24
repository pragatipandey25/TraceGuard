import React from 'react';
import { ShieldAlert, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmptyState({
  icon: Icon = ShieldAlert,
  title = 'No records found',
  description = 'Get started by running your first assessment or adding an authorized target.',
  actionLabel,
  actionLink,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
        {description}
      </p>
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
