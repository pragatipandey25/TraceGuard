import mongoose from 'mongoose';

const checkResultSchema = new mongoose.Schema(
  {
    checkId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ['passed', 'failed', 'warning', 'skipped', 'error'],
      required: true
    },
    durationMs: { type: Number, default: 0 },
    message: { type: String, default: '' },
    error: { type: String, default: null }
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Target',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled'],
      default: 'queued',
      index: true
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    durationMs: {
      type: Number,
      default: 0
    },
    summary: {
      totalChecks: { type: Number, default: 0 },
      passedChecks: { type: Number, default: 0 },
      failedChecks: { type: Number, default: 0 },
      skippedChecks: { type: Number, default: 0 },
      totalFindings: { type: Number, default: 0 },
      criticalCount: { type: Number, default: 0 },
      highCount: { type: Number, default: 0 },
      mediumCount: { type: Number, default: 0 },
      lowCount: { type: Number, default: 0 },
      infoCount: { type: Number, default: 0 },
      postureScore: { type: Number, default: 100 } // heuristic score 0 - 100
    },
    checkResults: [checkResultSchema],
    errorSummary: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

assessmentSchema.index({ ownerId: 1, createdAt: -1 });
assessmentSchema.index({ targetId: 1, createdAt: -1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
