import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  FileCheck,
  CheckCircle,
  ArrowRight,
  Server,
  Key,
  Globe,
  FileText,
  AlertTriangle,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-blue-500/30">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              TraceGuard
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/app"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
              >
                Go to Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Lock className="w-3.5 h-3.5" />
            Passive & Bounded Web Security Assessment
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Assess, remediate, and track your web application{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              security posture
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            TraceGuard performs automated, evidence-backed security checks on authorized web applications. Identify configuration weaknesses, prioritize fixes, and track remediation over time.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/app' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/25 transition-all"
            >
              Start Security Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-all"
            >
              Log in with Demo Account
            </Link>
          </div>

          {/* Key metrics / trust indicators */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-2xl font-mono font-bold text-blue-400">8+</p>
              <p className="text-xs text-slate-400 mt-1">Core Audit Checks</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-2xl font-mono font-bold text-emerald-400">0 ms</p>
              <p className="text-xs text-slate-400 mt-1">Non-Destructive Execution</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-2xl font-mono font-bold text-amber-400">PDF / JSON</p>
              <p className="text-xs text-slate-400 mt-1">Executive Reports</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <p className="text-2xl font-mono font-bold text-purple-400">100%</p>
              <p className="text-xs text-slate-400 mt-1">Deterministic Rules</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Check Highlights */}
      <section className="py-16 bg-slate-950/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Comprehensive Configuration Auditing
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Every check is deterministic, bounded, and produces actionable evidence with OWASP remediation guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Security Headers & Defense-in-Depth
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Evaluates Content-Security-Policy, Strict-Transport-Security (HSTS), X-Content-Type-Options, Referrer-Policy, and clickjacking protection (X-Frame-Options & frame-ancestors).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                TLS / SSL & Certificate Hygiene
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connects directly to TLS sockets, evaluating certificate expiration, trust chains, Subject Alternative Names (SANs) matching, and deprecated cryptographic protocol support.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                CORS & Cookie Attributes
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Inspects Set-Cookie directives for Secure, HttpOnly, and SameSite attributes. Safely tests CORS policies for dangerous wildcard origins and reflected Origin parameters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Authorized Testing Notice */}
      <section className="py-12 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-semibold text-white mb-1">
                Authorized Testing Policy & Anti-Abuse Controls
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                TraceGuard is engineered strictly for assessing applications you own or have explicit, verified authorization to test. The scanner enforces robust anti-SSRF protections, blocking all private IP ranges (RFC 1918), loopback interfaces, cloud metadata endpoints, and non-standard ports. Users must confirm ownership authorization before initiating any assessment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-300">TraceGuard</span>
            <span>— Web Security Assessment & Remediation Platform</span>
          </div>
          <div>
            <span>Non-intrusive automated auditing • MERN Stack Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
