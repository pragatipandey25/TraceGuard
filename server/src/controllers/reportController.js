import { Assessment } from '../models/Assessment.js';
import { Target } from '../models/Target.js';
import { Finding } from '../models/Finding.js';
import { buildAssessmentPdf } from '../utils/pdfGenerator.js';

export const getAssessmentJsonReport = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.assessmentId,
      ownerId: req.user._id
    }).populate('targetId');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or unauthorized'
      });
    }

    const findings = await Finding.find({
      assessmentId: assessment._id,
      ownerId: req.user._id
    }).sort({ severity: 1 });

    const report = {
      platform: 'TraceGuard Web Security Assessment Platform',
      version: '1.0.0',
      generatedAt: new Date(),
      auditor: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      assessment: {
        id: assessment._id,
        status: assessment.status,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        durationMs: assessment.durationMs,
        summary: assessment.summary,
        checkResults: assessment.checkResults,
        errorSummary: assessment.errorSummary
      },
      target: {
        id: assessment.targetId._id,
        name: assessment.targetId.name,
        baseUrl: assessment.targetId.baseUrl,
        environment: assessment.targetId.environment,
        description: assessment.targetId.description,
        authorizationConfirmedAt: assessment.targetId.authorizationConfirmedAt
      },
      findings: findings.map(f => ({
        id: f._id,
        ruleId: f.ruleId,
        title: f.title,
        category: f.category,
        severity: f.severity,
        confidence: f.confidence,
        status: f.status,
        normalizedEndpoint: f.normalizedEndpoint,
        description: f.description,
        impact: f.impact,
        evidence: f.evidence,
        remediation: f.remediation,
        references: f.references,
        firstDetectedAt: f.firstDetectedAt,
        lastObservedAt: f.lastObservedAt
      })),
      disclaimer: 'TraceGuard performs automated passive and non-intrusive configuration checks against explicitly authorized targets. This assessment does not substitute for a comprehensive penetration test.'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="traceguard-report-${assessment._id}.json"`);
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

export const getAssessmentPdfReport = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.assessmentId,
      ownerId: req.user._id
    }).populate('targetId');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or unauthorized'
      });
    }

    const findings = await Finding.find({
      assessmentId: assessment._id,
      ownerId: req.user._id
    }).sort({ severity: 1 });

    const doc = buildAssessmentPdf(assessment, assessment.targetId, findings, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="traceguard-report-${assessment._id}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (err) {
    next(err);
  }
};
