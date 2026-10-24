import { Assessment } from '../models/Assessment.js';
import { Target } from '../models/Target.js';
import { Finding } from '../models/Finding.js';
import { calculatePostureScore } from '../services/scanner/findingNormalizer.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalTargets,
      totalAssessments,
      completedAssessments,
      openFindingsList,
      resolvedFindingsCount,
      recentAssessments
    ] = await Promise.all([
      Target.countDocuments({ ownerId: userId }),
      Assessment.countDocuments({ ownerId: userId }),
      Assessment.countDocuments({ ownerId: userId, status: { $in: ['completed', 'completed_with_errors'] } }),
      Finding.find({ ownerId: userId, status: { $in: ['Open', 'In Progress'] } }),
      Finding.countDocuments({ ownerId: userId, status: 'Fixed' }),
      Assessment.find({ ownerId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('targetId', 'name baseUrl environment')
    ]);

    const severityCounts = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0
    };

    const categoryCounts = {};

    for (const f of openFindingsList) {
      if (severityCounts[f.severity] !== undefined) {
        severityCounts[f.severity]++;
      }
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    }

    const postureScore = calculatePostureScore(openFindingsList);

    res.status(200).json({
      success: true,
      data: {
        totalTargets,
        totalAssessments,
        completedAssessments,
        openFindingsCount: openFindingsList.length,
        resolvedFindingsCount,
        postureScore,
        severityCounts,
        categoryCounts,
        recentAssessments,
        disclaimer: 'Calculated security posture is an internal heuristic based on identified configuration findings, not an endorsement or certification.'
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getDashboardTrends = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get historical completed assessments ordered by date
    const assessments = await Assessment.find({
      ownerId: userId,
      status: { $in: ['completed', 'completed_with_errors'] }
    })
      .sort({ createdAt: 1 })
      .limit(15)
      .select('createdAt summary');

    const timeline = assessments.map(a => ({
      date: a.createdAt.toISOString().split('T')[0],
      postureScore: a.summary?.postureScore ?? 100,
      totalFindings: a.summary?.totalFindings ?? 0,
      critical: a.summary?.criticalCount ?? 0,
      high: a.summary?.highCount ?? 0,
      medium: a.summary?.mediumCount ?? 0,
      low: a.summary?.lowCount ?? 0
    }));

    // Category distribution for pie / radar chart
    const categoryAggregation = await Finding.aggregate([
      { $match: { ownerId: userId, status: { $in: ['Open', 'In Progress'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryDistribution = categoryAggregation.map(c => ({
      category: c._id,
      count: c.count
    }));

    res.status(200).json({
      success: true,
      data: {
        timeline,
        categoryDistribution
      }
    });
  } catch (err) {
    next(err);
  }
};
