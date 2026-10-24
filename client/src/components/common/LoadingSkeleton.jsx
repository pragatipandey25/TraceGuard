import React from 'react';

export function CardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-5 animate-pulse"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/6" />
          </div>
          <div className="h-6 bg-slate-200 dark:bg-navy-800 rounded w-1/2 mb-3" />
          <div className="h-3 bg-slate-200 dark:bg-navy-800 rounded w-full mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-navy-800 rounded w-4/5" />
        </div>
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-100 dark:bg-navy-850 border-b border-slate-200 dark:border-navy-800" />
      <div className="divide-y divide-slate-100 dark:divide-navy-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 px-4 flex items-center justify-between">
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/4" />
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/5" />
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/6" />
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/8" />
          </div>
        ))}
      </div>
    </div>
  );
}
