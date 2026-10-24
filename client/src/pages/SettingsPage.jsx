import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Globe,
  Lock,
  User,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TableSkeleton } from '../components/common/LoadingSkeleton.jsx';

export function SettingsPage() {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Target Modal / form
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [description, setDescription] = useState('');
  const [authorizedAgreed, setAuthorizedAgreed] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/targets');
      if (res.data.success) {
        setTargets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load targets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleCreateTarget = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!authorizedAgreed) {
      setModalError('You must certify ownership or authorized permission to test this target.');
      return;
    }

    setModalLoading(true);
    try {
      const res = await api.post('/targets', {
        name,
        baseUrl,
        environment,
        description,
        authorizationConfirmed: true
      });

      if (res.data.success) {
        setShowAddModal(false);
        setName('');
        setBaseUrl('');
        setDescription('');
        setAuthorizedAgreed(false);
        await fetchTargets();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to register target.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTarget = async (targetId, targetName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${targetName}"? All associated assessments and findings will be permanently deleted.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/targets/${targetId}`);
      await fetchTargets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete target.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Platform Settings & Targets
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage authorized testing scopes, auditor identity, and anti-abuse security quotas.
        </p>
      </div>

      {/* Auditor Profile Card */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {user?.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email} • Role: <span className="uppercase font-semibold text-blue-500">{user?.role}</span>
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Authorized Auditor
        </span>
      </div>

      {/* Target Management Section */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Authorized Target Applications ({targets.length})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Only verified, authorized domains may be scanned by TraceGuard.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Target
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={3} />
        ) : targets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No authorized targets registered. Click "Add Target" above to configure your first application.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-navy-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-navy-800">
                  <th className="py-2.5 px-4 font-semibold">Target Name</th>
                  <th className="py-2.5 px-4 font-semibold">Base URL</th>
                  <th className="py-2.5 px-4 font-semibold">Environment</th>
                  <th className="py-2.5 px-4 font-semibold">Open Findings</th>
                  <th className="py-2.5 px-4 font-semibold">Authorized At</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {targets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {t.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {t.baseUrl}
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-400">
                      {t.environment}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {t.openFindingCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(t.authorizationConfirmedAt || t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTarget(t._id, t.name)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete target and findings"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Safeguards & Quotas */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span>Scanner Engine Safeguards & Quotas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">SSRF Defense</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Strictly blocks localhost, 127.0.0.1, RFC 1918 subnets, and cloud metadata (169.254.169.254).
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">Concurrency Limits</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Max 2 concurrent scans globally, with an hourly rate limit to prevent denial of service.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">Bounded Request Cap</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              512KB response byte limit and 15s timeouts prevent runaway socket buffers.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Add Target */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register Authorized Target
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTarget} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Application Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Customer Authentication Gateway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Public Base URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Purpose (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Internal audit scope notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    required
                    checked={authorizedAgreed}
                    onChange={(e) => setAuthorizedAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>
                    I confirm that I own this application or possess explicit authorization to conduct security assessments.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {modalLoading ? 'Validating...' : 'Register Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
