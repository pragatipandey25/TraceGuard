import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.jsx';
import { ScoreDial } from '../components/common/ScoreDial.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { LandingPage } from '../pages/LandingPage.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

describe('UI Badges', () => {
  it('renders Critical, High, Medium severity badges correctly', () => {
    const { rerender } = render(<SeverityBadge severity="Critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();

    rerender(<SeverityBadge severity="High" />);
    expect(screen.getByText('High')).toBeInTheDocument();

    rerender(<SeverityBadge severity="Medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders status badges with proper label', () => {
    render(<StatusBadge status="Fixed" />);
    expect(screen.getByText('Fixed')).toBeInTheDocument();
  });
});

describe('ScoreDial Component', () => {
  it('renders score and heuristic disclaimer note', () => {
    render(<ScoreDial score={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText(/Internal heuristic score/i)).toBeInTheDocument();
  });

  it('updates text when score is in remediation territory', () => {
    render(<ScoreDial score={35} />);
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('Needs Remediation')).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('renders custom empty message and action button', () => {
    render(
      <BrowserRouter>
        <EmptyState
          title="No targets found"
          description="Please add an authorized application."
          actionLabel="Add Target"
          actionLink="/app/settings"
        />
      </BrowserRouter>
    );
    expect(screen.getByText('No targets found')).toBeInTheDocument();
    expect(screen.getByText('Add Target')).toBeInTheDocument();
  });
});

describe('Landing Page', () => {
  it('renders hero title and authorized testing banner', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getAllByText(/TraceGuard/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Authorized Testing Policy/i)).toBeInTheDocument();
  });
});
