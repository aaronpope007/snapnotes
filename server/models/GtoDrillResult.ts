import mongoose from 'mongoose';

const gtoDrillResultSchema = new mongoose.Schema(
  {
    drillId: { type: mongoose.Schema.Types.ObjectId, ref: 'GtoDrill', required: true },
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    evLoss: { type: Number },
    handsPlayed: { type: Number, min: 1 },
    accuracy: { type: Number, min: 0, max: 100 },
    bestActionRate: { type: Number, min: 0, max: 100 },
    evDiff: { type: Number },
    score: { type: Number },
    notes: { type: String, default: '', maxlength: 500 },
    studySessionId: { type: String },
  },
  { timestamps: true }
);

gtoDrillResultSchema.index({ drillId: 1, date: -1 });
gtoDrillResultSchema.index({ userId: 1, date: -1 });

export const GtoDrillResult = mongoose.model('GtoDrillResult', gtoDrillResultSchema);
