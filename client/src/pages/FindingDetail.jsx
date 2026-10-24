import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Clock,
  Send,
  AlertTriangle,
  Lock,
  Layers,
  HelpCircle
} from 'lucide-react';
import api from '../services/api.js';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { CardSkeleton } from '../components/common/LoadingSkeleton.jsx';

export function FindingDetail() {
  const { id } = useParams();
  const [finding, setFinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Status update modal / form
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Note form
  const [noteContent, setNoteContent] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // AI / Assistant explanation
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState(null);

  const fetchFinding = async () => {
    try {
      const res = await api.get(`/findings/${id}`);
      if (res.data.success) {
        setFinding(res.data.data);
        setNewStatus(res.data.data.status);
        if (res.data.data.aiExplanation) {
          setExplanation(res.data.data.aiExplanation);
        }
      }
    } catch (err) {
      console.error('Error fetching finding', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinding();
  }, [id]);

  const handleCopySnippet = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setStatusError('');

    if (newStatus === 'Accepted Risk' && (!statusReason || statusReason.trim().length < 10)) {
      setStatusError('Accepting risk requires a detailed explanation (at least 10 characters).');
      return;
    }

    setStatusLoading(true);
    try {
      const res = await api.patch(`/findings/${id}/status`, {
        status: newStatus,
        reason: statusReason
      });
      if (res.data.success) {
        setFinding(res.data.data);
        setStatusReason('');
      }
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setNoteLoading(true);
    try {
      const res = await api.post(`/findings/${id}/notes`, {
        content: noteContent.trim()
      });
      if (res.data.success) {
        setFinding(res.data.data);
        setNoteContent('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleRequestExplanation = async () => {
    setExplaining(true);
    try {
      const res = await api.post(`/findings/${id}/explain`);
      if (res.data.success) {
        setExplanation(res.data.data);
      }
    } catch (err) {
      alert('Explanation service temporarily unavailable.');
    } finally {
      setExplaining(false);
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

  if (!finding) {
    return (
      <div className="p-8 text-center text-slate-500">
        Finding record not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header and Back Link */}
      <div>
        <Link
          to="/app/findings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Findings Inventory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
              <span className="text-xs font-mono text-slate-400">{finding.ruleId}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {finding.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Affected Endpoint:{' '}
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {finding.affectedUrl}
              </span>{' '}
              • Target:{' '}
              <span className="font-semibold">{finding.targetId?.name}</span>
            </p>
          </div>

          {/* AI / Security Assistant Explainer Button */}
          <button
            onClick={handleRequestExplanation}
            disabled={explaining}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors shrink-0 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            {explaining ? 'Analyzing finding...' : 'Explain with Security Assistant'}
          </button>
        </div>
      </div>

      {/* AI / Security Assistant Explanation Drawer (if generated) */}
      {explanation && (
        <div className="p-5 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Security Assistant Plain-English Explanation
            </span>
            <span className="text-[10px] text-slate-400">
              Educational Breakdown
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            {explanation.explanation}
          </p>
          {explanation.practicalImpact && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Why it matters: </span>
              {explanation.practicalImpact}
            </div>
          )}
          {explanation.suggestedFix && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Quick fix guidance: </span>
              {explanation.suggestedFix}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Description + Evidence and Remediation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Impact Card */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Issue Description
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {finding.description}
              </p>
            </div>

            {finding.impact && (
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Security Impact
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {finding.impact}
                </p>
              </div>
            )}
          </div>

          {/* Observed Evidence */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Observed Evidence
            </h2>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{JSON.stringify(finding.evidence, null, 2)}</pre>
            </div>
            <p className="text-[11px] text-slate-400">
              TraceGuard strictly redacts sensitive tokens, authentication secrets, and session cookies from stored evidence.
            </p>
          </div>

          {/* Remediation Checklist & Configuration Snippet */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recommended Remediation
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Standard Fix Pattern
              </span>
            </div>

            {finding.remediation?.summary && (
              <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {finding.remediation.summary}
              </p>
            )}

            {/* Checklist */}
            {finding.remediation?.steps && finding.remediation.steps.length > 0 && (
              <ul className="space-y-2">
                {finding.remediation.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Config Snippet */}
            {finding.remediation?.configSnippet && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-mono text-[11px]">Example Configuration</span>
                  <button
                    onClick={() => handleCopySnippet(finding.remediation.configSnippet)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <code>{finding.remediation.configSnippet}</code>
                </div>
              </div>
            )}

            {/* References */}
            {finding.references && finding.references.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800">
                <h4 className="text-[11px] font-semibold uppercase text-slate-400 mb-2">
                  Authoritative References
                </h4>
                <div className="space-y-1">
                  {finding.references.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline block"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {r.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Status Workflow, Notes, and Audit Trail */}
        <div className="space-y-6">
          {/* Status Workflow Card */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Remediation Status Workflow
            </h3>

            {statusError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
                {statusError}
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Fixed">Fixed / Remediated</option>
                  <option value="Accepted Risk">Accepted Risk</option>
                  <option value="False Positive">False Positive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Audit Reason {newStatus === 'Accepted Risk' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  required={newStatus === 'Accepted Risk'}
                  placeholder={newStatus === 'Accepted Risk' ? 'Explain risk acceptance rationale...' : 'Optional comment for status history...'}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={statusLoading || newStatus === finding.status && !statusReason}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {statusLoading ? 'Updating...' : 'Update Finding Status'}
              </button>
            </form>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status Audit History
            </h3>
            <div className="space-y-3">
              {(finding.statusHistory || []).map((h, i) => (
                <div key={i} className="text-xs pb-2 border-b border-slate-100 dark:border-navy-800 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={h.status} size="xs" />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(h.changedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {h.reason && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                      {h.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team Remediation Notes */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Remediation Notes ({finding.notes?.length || 0})
            </h3>

            {/* Existing notes */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {(!finding.notes || finding.notes.length === 0) ? (
                <p className="text-xs text-slate-400">No notes posted yet.</p>
              ) : (
                finding.notes.map((note) => (
                  <div key={note._id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-850 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{note.authorName}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add note form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <input
                type="text"
                placeholder="Add remediation note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={noteLoading || !noteContent.trim()}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {noteLoading ? 'Saving...' : 'Post Note'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
