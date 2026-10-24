import { Finding } from '../models/Finding.js';
import { generateFindingExplanation } from '../utils/aiExplainer.js';

export const getFindings = async (req, res, next) => {
  try {
    const {
      targetId,
      severity,
      category,
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = { ownerId: req.user._id };

    if (targetId) query.targetId = targetId;
    if (severity) query.severity = severity;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ruleId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Severity sort ordering: Critical > High > Medium > Low > Informational
    const [findings, total] = await Promise.all([
      Finding.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('targetId', 'name baseUrl environment'),
      Finding.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: findings,
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

export const getFindingById = async (req, res, next) => {
  try {
    const finding = await Finding.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    })
      .populate('targetId', 'name baseUrl environment')
      .populate('assessmentId', 'status createdAt durationMs');

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Finding not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      data: finding
    });
  } catch (err) {
    next(err);
  }
};

export const updateFindingStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const finding = await Finding.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Finding not found or unauthorized'
      });
    }

    if (status === 'Accepted Risk' && (!reason || reason.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        message: 'Accepting security risk requires a detailed justification (at least 10 characters).'
      });
    }

    finding.status = status;
    finding.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: reason || `Status updated to ${status}`
    });

    await finding.save();

    res.status(200).json({
      success: true,
      message: `Finding status updated to ${status}`,
      data: finding
    });
  } catch (err) {
    next(err);
  }
};

export const addFindingNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    const finding = await Finding.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Finding not found or unauthorized'
      });
    }

    finding.notes.push({
      authorId: req.user._id,
      authorName: req.user.name,
      content,
      createdAt: new Date()
    });

    await finding.save();

    res.status(201).json({
      success: true,
      message: 'Remediation note added successfully',
      data: finding
    });
  } catch (err) {
    next(err);
  }
};

export const explainFindingHandler = async (req, res, next) => {
  try {
    const finding = await Finding.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Finding not found or unauthorized'
      });
    }

    const explanation = await generateFindingExplanation(finding);
    finding.aiExplanation = explanation;
    await finding.save();

    res.status(200).json({
      success: true,
      data: explanation
    });
  } catch (err) {
    next(err);
  }
};
