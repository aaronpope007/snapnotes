import mongoose from 'mongoose';

const reviewerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

reviewerSchema.index({ name: 1 });

export const Reviewer = mongoose.model('Reviewer', reviewerSchema);
