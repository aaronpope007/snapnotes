import mongoose from 'mongoose';
import { DEFAULT_HAND_TITLE } from '../constants.js';

export const HAND_STATUS = ['open', 'archived'] as const;
export type HandStatus = (typeof HAND_STATUS)[number];

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, default: '' },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, required: true, default: Date.now },
    editedAt: { type: Date, default: undefined },
    editedBy: { type: String, default: undefined },
    authorOnly: { type: Boolean, default: false },
  },
  { _id: false }
);

const ratingEntrySchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    rating: { type: Number, required: true },
  },
  { _id: false }
);

const handToReviewSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: DEFAULT_HAND_TITLE },
    handText: { type: String, required: true, default: '' },
    spoilerText: { type: String, default: '' },
    status: {
      type: String,
      enum: HAND_STATUS,
      default: 'open',
    },
    createdBy: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    comments: {
      type: [commentSchema],
      default: [],
    },
    starRatings: { type: [ratingEntrySchema], default: [] },
    spicyRatings: { type: [ratingEntrySchema], default: [] },
    archivedAt: { type: Date, default: null },
    taggedReviewerNames: { type: [String], default: [] },
    reviewedBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

handToReviewSchema.index({ status: 1, createdAt: -1 });

export const HandToReview = mongoose.model('HandToReview', handToReviewSchema);
