import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldPlus,
  History,
  AlertTriangle,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  Shield,
  Menu,
  X,
  Bell,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { label: 'Overview', path: '/app', icon: LayoutDashboard },
    { label: 'New Assessment', path: '/app/assessments/new', icon: ShieldPlus },
    { label: 'Assessment History', path: '/app/assessments', icon: History },
    { label: 'Findings', path: '/app/findings', icon: AlertTriangle },
    { label: 'Remediation', path: '/app/remediation', icon: Wrench },
    { label: 'Reports', path: '/app/reports', icon: FileText },
    { label: 'Settings', path: '/app/settings', icon: Settings }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/findings?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Generate dynamic breadcrumb items
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.slice(1).map((part, index) => {
    const fullPath = '/app/' + pathParts.slice(1, index + 2).join('/');
    const title = part.charAt(0).toUpperCase() + part.slice(1);
    return { title, fullPath };
  });

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shrink-0">
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-navy-800 gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
              TraceGuard
            </h1>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Security Auditor
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-200 dark:border-navy-800">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-navy-850">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Security Auditor'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.role === 'admin' ? 'Administrator' : 'Auditor'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-md"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 transform transition-transform duration-200 md:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-base text-slate-900 dark:text-white">
              TraceGuard
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-slate-500 md:hidden hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Link to="/app" className="hover:text-blue-500 font-medium">
                Home
              </Link>
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={b.fullPath}>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  <span
                    className={
                      i === breadcrumbs.length - 1
                        ? 'font-semibold text-slate-900 dark:text-white'
                        : 'hover:text-blue-500'
                    }
                  >
                    {b.title}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Quick search & user actions */}
          <div className="flex items-center gap-3">
            {/* Quick search input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search findings (CSP, CORS...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-navy-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-navy-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
              />
            </form>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification bell icon */}
            <button
              onClick={() => alert('No unread system alerts.')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-2 right-2 ring-2 ring-white dark:ring-navy-900" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-semibold hidden lg:inline text-slate-700 dark:text-slate-200">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 shadow-lg py-1 z-30 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-700">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {user?.name}
                      </p>
                      <p className="text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/app/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800"
                    >
                      Target Management
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-rose-500 hover:bg-slate-50 dark:hover:bg-navy-800 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <Outlet />
          </div>
          <footer className="mt-12 pt-4 border-t border-slate-200 dark:border-navy-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>TraceGuard — Automated Web Security Assessment Platform</span>
            <span>
              Created by{' '}
              <a
                href="https://github.com/pragatipandey25"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Pragati Pandey
              </a>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
