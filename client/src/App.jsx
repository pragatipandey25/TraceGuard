import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { AppShell } from './components/layout/AppShell.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { OverviewDashboard } from './pages/OverviewDashboard.jsx';
import { NewAssessment } from './pages/NewAssessment.jsx';
import { AssessmentHistory } from './pages/AssessmentHistory.jsx';
import { AssessmentComparison } from './pages/AssessmentComparison.jsx';
import { AssessmentDetail } from './pages/AssessmentDetail.jsx';
import { FindingsList } from './pages/FindingsList.jsx';
import { FindingDetail } from './pages/FindingDetail.jsx';
import { RemediationWorkspace } from './pages/RemediationWorkspace.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotFound } from './pages/NotFound.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-mono">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function App() {
  return (
    <Routes>
      {/* Public Marketing & Auth Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewDashboard />} />
        <Route path="assessments/new" element={<NewAssessment />} />
        <Route path="assessments" element={<AssessmentHistory />} />
        <Route path="assessments/compare" element={<AssessmentComparison />} />
        <Route path="assessments/:id" element={<AssessmentDetail />} />
        <Route path="findings" element={<FindingsList />} />
        <Route path="findings/:id" element={<FindingDetail />} />
        <Route path="remediation" element={<RemediationWorkspace />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
