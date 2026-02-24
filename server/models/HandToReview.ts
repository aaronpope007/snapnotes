import mongoose from 'mongoose';

export const HAND_STATUS = ['open', 'archived'] as const;
export type HandStatus = (typeof HAND_STATUS)[number];

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, default: '' },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const handToReviewSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: 'Untitled hand' },
    handText: { type: String, required: true, default: '' },
    status: {
      type: String,
      enum: HAND_STATUS,
      default: 'open',
    },
    createdBy: { type: String, required: true },
    comments: {
      type: [commentSchema],
      default: [],
    },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

handToReviewSchema.index({ status: 1, createdAt: -1 });

export const HandToReview = mongoose.model('HandToReview', handToReviewSchema);
