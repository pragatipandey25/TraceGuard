import { Assessment } from '../models/Assessment.js';
import { Target } from '../models/Target.js';
import { Finding } from '../models/Finding.js';
import { startAssessment, cancelAssessment } from '../services/scanner/scanOrchestrator.js';

export const getAssessments = async (req, res, next) => {
  try {
    const { targetId, status, page = 1, limit = 10 } = req.query;
    const query = { ownerId: req.user._id };

    if (targetId) query.targetId = targetId;
    if (status) query.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('targetId', 'name baseUrl environment'),
      Assessment.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: assessments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAssessmentById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    }).populate('targetId');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (err) {
    next(err);
  }
};

export const createAssessment = async (req, res, next) => {
  try {
    const { targetId } = req.body;

    const target = await Target.findOne({ _id: targetId, ownerId: req.user._id });
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Authorized target not found'
      });
    }

    // Check if an assessment is already running for this target
    const running = await Assessment.findOne({
      targetId: target._id,
      status: { $in: ['queued', 'running'] }
    });

    if (running) {
      return res.status(409).json({
        success: false,
        message: 'An assessment is already queued or active for this target.',
        assessmentId: running._id
      });
    }

    const assessment = new Assessment({
      ownerId: req.user._id,
      targetId: target._id,
      status: 'queued',
      progress: 0
    });

    await assessment.save();

    // Trigger asynchronous scanner
    startAssessment(assessment._id).catch(err => {
      console.error(`Error launching assessment ${assessment._id}:`, err);
    });

    res.status(201).json({
      success: true,
      message: 'Assessment launched successfully',
      data: assessment
    });
  } catch (err) {
    next(err);
  }
};

export const cancelAssessmentHandler = async (req, res, next) => {
  try {
    const updated = await cancelAssessment(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Assessment cancelled successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

export const getAssessmentFindings = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

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

    res.status(200).json({
      success: true,
      data: findings
    });
  } catch (err) {
    next(err);
  }
};

export const compareAssessments = async (req, res, next) => {
  try {
    const { firstId, secondId } = req.query;

    if (!firstId || !secondId) {
      return res.status(400).json({
        success: false,
        message: 'Both firstId and secondId query parameters are required for comparison.'
      });
    }

    const [firstAssessment, secondAssessment] = await Promise.all([
      Assessment.findOne({ _id: firstId, ownerId: req.user._id }).populate('targetId'),
      Assessment.findOne({ _id: secondId, ownerId: req.user._id }).populate('targetId')
    ]);

    if (!firstAssessment || !secondAssessment) {
      return res.status(404).json({
        success: false,
        message: 'One or both assessments not found or unauthorized.'
      });
    }

    // Ensure targets match
    if (firstAssessment.targetId._id.toString() !== secondAssessment.targetId._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot compare assessments across different targets. Both assessments must target the same application.'
      });
    }

    const [findingsFirst, findingsSecond] = await Promise.all([
      Finding.find({ assessmentId: firstAssessment._id, ownerId: req.user._id }),
      Finding.find({ assessmentId: secondAssessment._id, ownerId: req.user._id })
    ]);

    const firstRules = new Map(findingsFirst.map(f => [f.ruleId, f]));
    const secondRules = new Map(findingsSecond.map(f => [f.ruleId, f]));

    const newFindings = [];
    const resolvedFindings = [];
    const unchangedFindings = [];
    const recurringFindings = [];

    // Findings in second assessment
    for (const [ruleId, finding] of secondRules.entries()) {
      if (!firstRules.has(ruleId)) {
        newFindings.push(finding);
      } else {
        const prev = firstRules.get(ruleId);
        if (prev.status === 'Fixed' && finding.status === 'Open') {
          recurringFindings.push(finding);
        } else {
          unchangedFindings.push(finding);
        }
      }
    }

    // Findings in first assessment not in second (resolved)
    for (const [ruleId, finding] of firstRules.entries()) {
      if (!secondRules.has(ruleId)) {
        resolvedFindings.push(finding);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        target: firstAssessment.targetId,
        baseline: {
          id: firstAssessment._id,
          date: firstAssessment.createdAt,
          postureScore: firstAssessment.summary?.postureScore,
          totalFindings: findingsFirst.length
        },
        comparison: {
          id: secondAssessment._id,
          date: secondAssessment.createdAt,
          postureScore: secondAssessment.summary?.postureScore,
          totalFindings: findingsSecond.length
        },
        deltaScore: (secondAssessment.summary?.postureScore || 0) - (firstAssessment.summary?.postureScore || 0),
        counts: {
          newCount: newFindings.length,
          resolvedCount: resolvedFindings.length,
          unchangedCount: unchangedFindings.length,
          recurringCount: recurringFindings.length
        },
        newFindings,
        resolvedFindings,
        unchangedFindings,
        recurringFindings
      }
    });
  } catch (err) {
    next(err);
  }
};
