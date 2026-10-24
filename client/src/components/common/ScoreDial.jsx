import React from 'react';

export function ScoreDial({ score = 100, label = 'Posture Score' }) {
  let color = 'text-emerald-500 stroke-emerald-500';
  let badgeText = 'Strong';
  let badgeBg = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

  if (score < 50) {
    color = 'text-rose-500 stroke-rose-500';
    badgeText = 'Needs Remediation';
    badgeBg = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  } else if (score < 80) {
    color = 'text-amber-500 stroke-amber-500';
    badgeText = 'Moderate Posture';
    badgeBg = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-navy-800"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-700 ease-out ${color}`}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            {score}
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            / 100
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
          {badgeText}
        </span>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[140px] mx-auto leading-tight">
          Internal heuristic score
        </p>
      </div>
    </div>
  );
}
