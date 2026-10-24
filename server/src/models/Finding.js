import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Fixed', 'Accepted Risk', 'False Positive'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const findingSchema = new mongoose.Schema(
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
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true
    },
    ruleId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['headers', 'cookies', 'cors', 'tls', 'info_disclosure', 'redirect', 'policy'],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      required: true,
      index: true
    },
    confidence: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'High'
    },
    normalizedEndpoint: {
      type: String,
      required: true
    },
    affectedUrl: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    impact: {
      type: String,
      required: true
    },
    remediation: {
      summary: { type: String, default: '' },
      steps: [{ type: String }],
      configSnippet: { type: String, default: '' },
      checklist: [{ type: String }]
    },
    references: [
      {
        title: { type: String },
        url: { type: String }
      }
    ],
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Fixed', 'Accepted Risk', 'False Positive'],
      default: 'Open',
      index: true
    },
    statusHistory: [statusHistorySchema],
    notes: [noteSchema],
    aiExplanation: {
      explanation: { type: String },
      practicalImpact: { type: String },
      suggestedFix: { type: String },
      generatedAt: { type: Date }
    },
    firstDetectedAt: {
      type: Date,
      default: Date.now
    },
    lastObservedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

findingSchema.index({ ownerId: 1, targetId: 1, ruleId: 1 });
findingSchema.index({ ownerId: 1, status: 1 });
findingSchema.index({ ownerId: 1, severity: 1 });

export const Finding = mongoose.model('Finding', findingSchema);
