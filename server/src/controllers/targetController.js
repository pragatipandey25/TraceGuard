import { Target } from '../models/Target.js';
import { Assessment } from '../models/Assessment.js';
import { Finding } from '../models/Finding.js';
import { validateTargetUrl } from '../services/scanner/targetValidator.js';

export const getTargets = async (req, res, next) => {
  try {
    const targets = await Target.find({ ownerId: req.user._id }).sort({ createdAt: -1 });

    // Enhance each target with finding count and latest assessment info
    const enhanced = await Promise.all(
      targets.map(async (target) => {
        const latestAssessment = await Assessment.findOne({ targetId: target._id })
          .sort({ createdAt: -1 })
          .select('status summary createdAt durationMs');

        const openFindingCount = await Finding.countDocuments({
          targetId: target._id,
          status: { $in: ['Open', 'In Progress'] }
        });

        return {
          ...target.toObject(),
          latestAssessment,
          openFindingCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enhanced
    });
  } catch (err) {
    next(err);
  }
};

export const getTargetById = async (req, res, next) => {
  try {
    const target = await Target.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found or unauthorized'
      });
    }

    const openFindingCount = await Finding.countDocuments({
      targetId: target._id,
      status: { $in: ['Open', 'In Progress'] }
    });

    const recentAssessments = await Assessment.find({ targetId: target._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        ...target.toObject(),
        openFindingCount,
        recentAssessments
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createTarget = async (req, res, next) => {
  try {
    const { name, baseUrl, environment, description, authorizationConfirmed } = req.body;

    if (!authorizationConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Explicit authorization is mandatory. You must certify ownership or permission.'
      });
    }

    // SSRF validation
    const validation = await validateTargetUrl(baseUrl);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid or restricted target URL: ${validation.error}`
      });
    }

    // Check for duplicate target for this user
    const existing = await Target.findOne({
      ownerId: req.user._id,
      baseUrl: validation.parsedUrl.origin
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A target with this base URL already exists in your account.'
      });
    }

    const target = new Target({
      ownerId: req.user._id,
      name,
      baseUrl: validation.parsedUrl.origin,
      environment: environment || 'production',
      description: description || '',
      authorizationConfirmedAt: new Date()
    });

    await target.save();

    res.status(201).json({
      success: true,
      message: 'Target registered successfully',
      data: target
    });
  } catch (err) {
    next(err);
  }
};

export const updateTarget = async (req, res, next) => {
  try {
    const { name, environment, description } = req.body;
    const target = await Target.findOne({ _id: req.params.id, ownerId: req.user._id });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found or unauthorized'
      });
    }

    if (name) target.name = name;
    if (environment) target.environment = environment;
    if (description !== undefined) target.description = description;

    await target.save();

    res.status(200).json({
      success: true,
      message: 'Target updated successfully',
      data: target
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTarget = async (req, res, next) => {
  try {
    const target = await Target.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found or unauthorized'
      });
    }

    // Delete associated assessments and findings
    await Assessment.deleteMany({ targetId: target._id });
    await Finding.deleteMany({ targetId: target._id });
    await target.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Target and all associated scan history deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
