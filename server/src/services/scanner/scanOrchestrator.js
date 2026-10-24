import { Assessment } from '../../models/Assessment.js';
import { Target } from '../../models/Target.js';
import { Finding } from '../../models/Finding.js';
import { safeFetch } from './safeHttpClient.js';
import { validateTargetUrl } from './targetValidator.js';
import { checkSecurityHeaders } from './checks/securityHeaders.js';
import { checkTlsConfiguration } from './checks/tlsConfiguration.js';
import { checkCookieSecurity } from './checks/cookieSecurity.js';
import { checkCorsConfiguration } from './checks/corsConfiguration.js';
import { checkHttpsRedirect } from './checks/httpsRedirect.js';
import { checkRobotsExposure } from './checks/robotsExposure.js';
import { checkSecurityTxt } from './checks/securityTxt.js';
import { checkServerDisclosure } from './checks/serverDisclosure.js';
import { normalizeFinding, calculatePostureScore } from './findingNormalizer.js';
import { config } from '../../config/env.js';

// Concurrency tracking
let activeScanCount = 0;
const scanQueue = [];
const runningScans = new Map(); // assessmentId -> abortController

/**
 * Enqueues or starts an assessment job.
 */
export async function startAssessment(assessmentId) {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) return;

  if (activeScanCount >= config.MAX_CONCURRENT_SCANS) {
    assessment.status = 'queued';
    await assessment.save();
    scanQueue.push(assessmentId);
    return;
  }

  runAssessmentJob(assessmentId);
}

/**
 * Cancels a running or queued assessment.
 */
export async function cancelAssessment(assessmentId, userId) {
  const assessment = await Assessment.findOne({ _id: assessmentId, ownerId: userId });
  if (!assessment) {
    throw new Error('Assessment not found or unauthorized');
  }

  if (assessment.status === 'completed' || assessment.status === 'failed' || assessment.status === 'cancelled') {
    throw new Error(`Assessment is already in state: ${assessment.status}`);
  }

  // If in queue, remove from queue
  const qIndex = scanQueue.indexOf(assessmentId.toString());
  if (qIndex !== -1) {
    scanQueue.splice(qIndex, 1);
  }

  // If running, abort
  const controller = runningScans.get(assessmentId.toString());
  if (controller) {
    controller.aborted = true;
    runningScans.delete(assessmentId.toString());
  }

  assessment.status = 'cancelled';
  assessment.completedAt = new Date();
  await assessment.save();

  processNextInQueue();
  return assessment;
}

function processNextInQueue() {
  if (scanQueue.length > 0 && activeScanCount < config.MAX_CONCURRENT_SCANS) {
    const nextId = scanQueue.shift();
    runAssessmentJob(nextId);
  }
}

/**
 * Worker executing the full assessment check pipeline.
 */
async function runAssessmentJob(assessmentId) {
  activeScanCount++;
  const abortState = { aborted: false };
  runningScans.set(assessmentId.toString(), abortState);

  const startTime = Date.now();
  let assessment;

  try {
    assessment = await Assessment.findById(assessmentId).populate('targetId');
    if (!assessment) return;

    if (abortState.aborted || assessment.status === 'cancelled') {
      return;
    }

    assessment.status = 'running';
    assessment.startedAt = new Date();
    assessment.progress = 5;
    await assessment.save();

    const target = assessment.targetId;
    if (!target) {
      throw new Error('Associated target not found');
    }

    // SSRF & target validation
    const targetValidation = await validateTargetUrl(target.baseUrl);
    if (!targetValidation.isValid) {
      assessment.status = 'failed';
      assessment.errorSummary = `Pre-scan security validation failed: ${targetValidation.error}`;
      assessment.completedAt = new Date();
      assessment.durationMs = Date.now() - startTime;
      await assessment.save();
      return;
    }

    const context = {
      ownerId: assessment.ownerId,
      targetId: target._id,
      assessmentId: assessment._id,
      targetUrl: target.baseUrl
    };

    const checkResults = [];
    const allDiscoveredFindings = [];

    // Step 1: Base HTTP request (15% progress)
    assessment.progress = 15;
    await assessment.save();

    let baseResponse = null;
    let baseFetchError = null;

    try {
      baseResponse = await safeFetch(target.baseUrl, {
        method: 'GET',
        followRedirects: true,
        maxRedirects: 5,
        timeoutMs: config.SCAN_TIMEOUT_MS
      });
    } catch (err) {
      baseFetchError = err.message;
    }

    if (abortState.aborted) return;

    // If initial base request completely failed, record and fail
    if (!baseResponse) {
      assessment.status = 'failed';
      assessment.errorSummary = `Could not reach target host: ${baseFetchError}`;
      assessment.completedAt = new Date();
      assessment.durationMs = Date.now() - startTime;
      assessment.checkResults = [
        {
          checkId: 'check-base-connection',
          name: 'Target Reachability',
          category: 'network',
          status: 'error',
          durationMs: Date.now() - startTime,
          message: 'Connection failed',
          error: baseFetchError
        }
      ];
      await assessment.save();
      return;
    }

    // Check 1: Security Headers (30% progress)
    if (abortState.aborted) return;
    try {
      const headerCheck = checkSecurityHeaders(baseResponse, context);
      checkResults.push({
        checkId: headerCheck.checkId,
        name: headerCheck.name,
        category: headerCheck.category,
        status: headerCheck.status,
        durationMs: 15,
        message: headerCheck.message
      });
      allDiscoveredFindings.push(...headerCheck.findings);
    } catch (err) {
      checkResults.push({
        checkId: 'check-security-headers',
        name: 'Security Headers Inspection',
        category: 'headers',
        status: 'error',
        error: err.message
      });
    }
    assessment.progress = 30;
    await assessment.save();

    // Check 2: Cookie Security (45% progress)
    if (abortState.aborted) return;
    try {
      const cookieCheck = checkCookieSecurity(baseResponse, context);
      checkResults.push({
        checkId: cookieCheck.checkId,
        name: cookieCheck.name,
        category: cookieCheck.category,
        status: cookieCheck.status,
        durationMs: 10,
        message: cookieCheck.message
      });
      allDiscoveredFindings.push(...cookieCheck.findings);
    } catch (err) {
      checkResults.push({
        checkId: 'check-cookie-security',
        name: 'Cookie Security Attributes',
        category: 'cookies',
        status: 'error',
        error: err.message
      });
    }
    assessment.progress = 45;
    await assessment.save();

    // Check 3: Server Disclosure (55% progress)
    if (abortState.aborted) return;
    try {
      const serverCheck = checkServerDisclosure(baseResponse, context);
      checkResults.push({
        checkId: serverCheck.checkId,
        name: serverCheck.name,
        category: serverCheck.category,
        status: serverCheck.status,
        durationMs: 10,
        message: serverCheck.message
      });
      allDiscoveredFindings.push(...serverCheck.findings);
    } catch (err) {
      checkResults.push({
        checkId: 'check-server-disclosure',
        name: 'Server & Stack Information Disclosure',
        category: 'info_disclosure',
        status: 'error',
        error: err.message
      });
    }
    assessment.progress = 55;
    await assessment.save();

    // Check 4: TLS Configuration (65% progress)
    if (abortState.aborted) return;
    try {
      const tlsCheck = await checkTlsConfiguration(context);
      checkResults.push({
        checkId: tlsCheck.checkId,
        name: tlsCheck.name,
        category: tlsCheck.category,
        status: tlsCheck.status,
        durationMs: 100,
        message: tlsCheck.message
      });
      allDiscoveredFindings.push(...tlsCheck.findings);
    } catch (err) {
      checkResults.push({
        checkId: 'check-tls-config',
        name: 'TLS / SSL Configuration',
        category: 'tls',
        status: 'error',
        error: err.message
      });
    }
    assessment.progress = 65;
    await assessment.save();

    // Check 5: CORS Configuration (75% progress)
    if (abortState.aborted) return;
    try {
      const corsCheck = await checkCorsConfiguration(baseResponse, context);
      checkResults.push({
        checkId: corsCheck.checkId,
        name: corsCheck.name,
        category: corsCheck.category,
        status: corsCheck.status,
        durationMs: 120,
        message: corsCheck.message
      });
      allDiscoveredFindings.push(...corsCheck.findings);
    } catch (err) {
      checkResults.push({
        checkId: 'check-cors-config',
        name: 'CORS Policy Evaluation',
        category: 'cors',
        status: 'error',
        error: err.message
      });
    }
    assessment.progress = 75;
    await assessment.save();

    // Check 6: HTTPS Redirect Check (85% progress)
    if (abortState.aborted) return;
    try {
      const redirectCheck = await checkHttpsRedirect(context);
      checkResults.push({
        checkId: redirectCheck.checkId,
        name: redirectCheck.name,
        category: redirectCheck.category,
        status: redirectCheck.status,
        durationMs: 100,
        message: redirectCheck.message
      });
      allDiscoveredFindings.push(...redirectCheck.findings);
    } catch (err) {
      checkResults.push({
        checkId: 'check-https-redirect',
        name: 'HTTPS Redirection & Downgrade Check',
        category: 'redirect',
        status: 'error',
        error: err.message
      });
    }
    assessment.progress = 85;
    await assessment.save();

    // Check 7: robots.txt & security.txt (92% progress)
    if (abortState.aborted) return;
    try {
      const robotsCheck = await checkRobotsExposure(context);
      checkResults.push({
        checkId: robotsCheck.checkId,
        name: robotsCheck.name,
        category: robotsCheck.category,
        status: robotsCheck.status,
        durationMs: 60,
        message: robotsCheck.message
      });
      allDiscoveredFindings.push(...robotsCheck.findings);

      const securityTxtCheck = await checkSecurityTxt(context);
      checkResults.push({
        checkId: securityTxtCheck.checkId,
        name: securityTxtCheck.name,
        category: securityTxtCheck.category,
        status: securityTxtCheck.status,
        durationMs: 60,
        message: securityTxtCheck.message
      });
      allDiscoveredFindings.push(...securityTxtCheck.findings);
    } catch (err) {
      // Ignored non-fatal
    }

    if (abortState.aborted) return;

    // Step 8: Normalize and persist findings to MongoDB (95% progress)
    assessment.progress = 95;
    await assessment.save();

    const normalizedList = allDiscoveredFindings.map(f => normalizeFinding(f, context));

    // Save or update persistent findings across assessments for this target
    for (const nf of normalizedList) {
      const existing = await Finding.findOne({
        ownerId: context.ownerId,
        targetId: context.targetId,
        ruleId: nf.ruleId
      });

      if (existing) {
        // Re-detected finding
        const wasFixed = existing.status === 'Fixed';
        existing.assessmentId = assessment._id;
        existing.lastObservedAt = new Date();
        existing.evidence = nf.evidence;
        existing.remediation = nf.remediation;
        if (wasFixed) {
          existing.status = 'Open';
          existing.statusHistory.push({
            status: 'Open',
            changedAt: new Date(),
            reason: 'Re-detected during scheduled assessment'
          });
        }
        await existing.save();
      } else {
        // Create new finding record
        const newFinding = new Finding({
          ...nf,
          statusHistory: [
            {
              status: 'Open',
              changedAt: new Date(),
              reason: 'Initial detection'
            }
          ]
        });
        await newFinding.save();
      }
    }

    // Step 9: Compute summary statistics
    const counts = {
      critical: normalizedList.filter(f => f.severity === 'Critical').length,
      high: normalizedList.filter(f => f.severity === 'High').length,
      medium: normalizedList.filter(f => f.severity === 'Medium').length,
      low: normalizedList.filter(f => f.severity === 'Low').length,
      info: normalizedList.filter(f => f.severity === 'Informational').length
    };

    const passedChecks = checkResults.filter(c => c.status === 'passed').length;
    const failedChecks = checkResults.filter(c => c.status === 'failed').length;
    const errorChecks = checkResults.filter(c => c.status === 'error').length;
    const skippedChecks = checkResults.filter(c => c.status === 'skipped').length;

    const postureScore = calculatePostureScore(normalizedList);

    assessment.summary = {
      totalChecks: checkResults.length,
      passedChecks,
      failedChecks,
      skippedChecks,
      totalFindings: normalizedList.length,
      criticalCount: counts.critical,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      infoCount: counts.info,
      postureScore
    };

    assessment.checkResults = checkResults;
    assessment.progress = 100;
    assessment.completedAt = new Date();
    assessment.durationMs = Date.now() - startTime;
    assessment.status = errorChecks > 0 ? 'completed_with_errors' : 'completed';
    await assessment.save();
  } catch (err) {
    if (assessment) {
      assessment.status = 'failed';
      assessment.errorSummary = err.message;
      assessment.completedAt = new Date();
      assessment.durationMs = Date.now() - startTime;
      await assessment.save();
    }
  } finally {
    runningScans.delete(assessmentId.toString());
    activeScanCount = Math.max(0, activeScanCount - 1);
    processNextInQueue();
  }
}
