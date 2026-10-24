/**
 * Finding Normalizer & Heuristic Scoring Engine
 * Ensures uniform finding attributes, assigns stable rule IDs, and computes
 * an internal security posture heuristic score.
 */

const SEVERITY_WEIGHTS = {
  Critical: 25,
  High: 15,
  Medium: 8,
  Low: 3,
  Informational: 0
};

/**
 * Calculates a 0-100 heuristic security score.
 * Note: Clearly labeled as an internal heuristic, not an official certification.
 */
export function calculatePostureScore(findings = []) {
  let score = 100;
  for (const finding of findings) {
    const penalty = SEVERITY_WEIGHTS[finding.severity] || 0;
    score -= penalty;
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * Normalizes raw check finding objects before persisting to MongoDB.
 */
export function normalizeFinding(rawFinding, context) {
  const { ownerId, targetId, assessmentId, targetUrl } = context;

  let normalizedEndpoint = '/';
  try {
    const u = new URL(rawFinding.affectedUrl || targetUrl);
    normalizedEndpoint = u.pathname || '/';
  } catch {
    normalizedEndpoint = '/';
  }

  return {
    ownerId,
    targetId,
    assessmentId,
    ruleId: rawFinding.ruleId,
    title: rawFinding.title,
    category: rawFinding.category,
    severity: rawFinding.severity || 'Medium',
    confidence: rawFinding.confidence || 'High',
    normalizedEndpoint,
    affectedUrl: rawFinding.affectedUrl || targetUrl,
    description: rawFinding.description,
    evidence: rawFinding.evidence || {},
    impact: rawFinding.impact,
    remediation: rawFinding.remediation || { steps: [], checklist: [] },
    references: rawFinding.references || [],
    status: 'Open',
    firstDetectedAt: new Date(),
    lastObservedAt: new Date()
  };
}
