import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Globe,
  AlertTriangle,
  Play,
  Plus,
  CheckSquare,
  Lock,
  Layers,
  FileCheck
} from 'lucide-react';
import api from '../services/api.js';

export function NewAssessment() {
  const [targets, setTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [showNewTargetForm, setShowNewTargetForm] = useState(false);

  // New Target Form fields
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [description, setDescription] = useState('');

  // Authorization checkbox
  const [authorizedConsent, setAuthorizedConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTargets() {
      try {
        const res = await api.get('/targets');
        if (res.data.success && res.data.data.length > 0) {
          setTargets(res.data.data);
          setSelectedTargetId(res.data.data[0]._id);
        } else {
          setShowNewTargetForm(true);
        }
      } catch (err) {
        console.error('Failed to load targets', err);
      }
    }
    fetchTargets();
  }, []);

  const handleLaunchAssessment = async (e) => {
    e.preventDefault();
    setError('');

    if (!authorizedConsent) {
      setError('You must confirm that you have explicit authorization to assess this target.');
      return;
    }

    setLoading(true);

    try {
      let targetIdToAssess = selectedTargetId;

      // If user is adding a new target on the fly
      if (showNewTargetForm) {
        const targetRes = await api.post('/targets', {
          name,
          baseUrl,
          environment,
          description,
          authorizationConfirmed: true
        });
        targetIdToAssess = targetRes.data.data._id;
      }

      // Launch assessment
      const assessRes = await api.post('/assessments', {
        targetId: targetIdToAssess
      });

      const assessmentId = assessRes.data.data._id;
      navigate(`/app/assessments/${assessmentId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start assessment. Please check inputs.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          New Security Assessment
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Execute automated, passive configuration audits against an authorized web target.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLaunchAssessment} className="space-y-6">
        {/* Step 1: Target Selection */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Select Authorized Target
              </h2>
            </div>
            {targets.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewTargetForm(!showNewTargetForm)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showNewTargetForm ? 'Choose Existing Target' : '+ Add New Target'}
              </button>
            )}
          </div>

          {!showNewTargetForm && targets.length > 0 ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Registered Applications
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {targets.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTargetId(t._id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedTargetId === t._id
                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {t.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400">
                        {t.environment}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-1">
                      {t.baseUrl}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Application Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Customer Portal API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Public Target Base URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Must be public HTTP/HTTPS. Localhost (127.0.0.1), private CIDRs (10.x, 192.168.x, 172.16.x), and cloud metadata endpoints are strictly blocked.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description / Scope Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Main billing frontend"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Assessment Scope / Check Modules */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-navy-800">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Assessment Modules Included
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: 'Security Headers', desc: 'CSP, HSTS, X-Content-Type, Clickjacking, Referrer' },
              { name: 'TLS / SSL Config', desc: 'Cert validity, expiry timeline, SANs matching' },
              { name: 'Cookie Security', desc: 'Secure, HttpOnly, SameSite, domain scoping' },
              { name: 'CORS Configuration', desc: 'Wildcards, reflected origins, credentials' },
              { name: 'HTTPS Redirect', desc: 'HTTP to HTTPS enforcement & downgrade checks' },
              { name: 'robots.txt Audit', desc: 'Disallowed path disclosures (non-crawled)' },
              { name: 'RFC 9116 security.txt', desc: 'Coordinated vulnerability disclosure contact' },
              { name: 'Server Fingerprints', desc: 'Server banner & X-Powered-By leak checks' }
            ].map((check, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-850"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  {check.name}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {check.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Authorization Consent Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>MANDATORY AUTHORIZED TESTING CERTIFICATION</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            TraceGuard executes passive network requests against the specified target. In compliance with computer fraud and abuse laws, you must have legitimate ownership or explicit authorization from the owner before performing security audits.
          </p>
          <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
            <input
              type="checkbox"
              required
              checked={authorizedConsent}
              onChange={(e) => setAuthorizedConsent(e.target.checked)}
              className="mt-0.5 rounded border-amber-400 text-blue-600 focus:ring-0"
            />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              I certify that I own this target or have received explicit written permission to audit it.
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Initiating Scan Engine...' : 'Launch Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
