import mongoose from 'mongoose';

const targetSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Target name is required'],
      trim: true,
      maxlength: [120, 'Target name cannot exceed 120 characters']
    },
    baseUrl: {
      type: String,
      required: [true, 'Base URL is required'],
      trim: true,
      lowercase: true
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production', 'other'],
      default: 'production'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    authorizationConfirmedAt: {
      type: Date,
      required: [true, 'Explicit authorization confirmation is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound index for owner and URL
targetSchema.index({ ownerId: 1, baseUrl: 1 });

export const Target = mongoose.model('Target', targetSchema);
