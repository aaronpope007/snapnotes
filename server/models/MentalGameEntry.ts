import mongoose from 'mongoose';

const mentalGameEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    sessionDate: { type: Date, required: true },
    stateRating: { type: Number, required: true, min: 1, max: 5 },
    observation: { type: String, required: true, default: '', maxlength: 280 },
    tiltAffected: { type: Boolean, default: false },
    fatigueAffected: { type: Boolean, default: false },
    confidenceAffected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mentalGameEntrySchema.index({ userId: 1, sessionDate: -1 });

export const MentalGameEntry = mongoose.model('MentalGameEntry', mentalGameEntrySchema);
