import mongoose from 'mongoose';

export const LEAK_CATEGORIES = [
  'preflop',
  'cbet',
  'river-sizing',
  'sizing',
  '3bet-defense',
  'bluff-frequency',
  'range-construction',
  'positional',
  'mental-game',
  'exploitative-adjustment',
  'study-process',
  'other',
] as const;

export const LEAK_STATUSES = ['identified', 'working', 'resolved'] as const;

const leakNoteSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    content: { type: String, required: true, default: '' },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true }
);

const leakSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true, default: '' },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: LEAK_CATEGORIES,
      default: 'other',
    },
    status: {
      type: String,
      enum: LEAK_STATUSES,
      default: 'identified',
    },
    linkedHandIds: { type: [String], default: [] },
    playerId: { type: String, default: null },
    playerUsername: { type: String, default: null },
    notes: { type: [leakNoteSchema], default: [] },
    resolvedAt: { type: Date, default: null },
    nextReviewAt: { type: Date, default: null },
    reviewStage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leakSchema.index({ userId: 1, status: 1, createdAt: -1 });
leakSchema.index({ userId: 1, nextReviewAt: 1 });
leakSchema.index({ userId: 1, playerId: 1 });

export const Leak = mongoose.model('Leak', leakSchema);
