import mongoose from 'mongoose';

export const EDGE_CATEGORIES = [
  'pool-tendency',
  'solver-deviation',
  'live-read',
  'sizing-exploit',
  'positional-edge',
  'meta-adjustment',
  'other',
] as const;

export const EDGE_STATUSES = ['developing', 'active', 'archived'] as const;

const edgeNoteSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    content: { type: String, required: true, default: '' },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true }
);

const edgeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    category: {
      type: String,
      enum: EDGE_CATEGORIES,
      default: 'other',
    },
    status: {
      type: String,
      enum: EDGE_STATUSES,
      default: 'developing',
    },
    linkedHandIds: { type: [String], default: [] },
    notes: { type: [edgeNoteSchema], default: [] },
  },
  { timestamps: true }
);

edgeSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Edge = mongoose.model('Edge', edgeSchema);
