import mongoose from 'mongoose';

const claimedUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      collation: { locale: 'en', strength: 2 },
    },
    passwordHash: { type: String, required: true },
    improvementNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ClaimedUser = mongoose.model('ClaimedUser', claimedUserSchema);
