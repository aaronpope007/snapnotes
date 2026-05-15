import mongoose from 'mongoose';

const gtoDrillResultSchema = new mongoose.Schema(
  {
    drillId: { type: mongoose.Schema.Types.ObjectId, ref: 'GtoDrill', required: true },
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    evLoss: { type: Number },
    handsPlayed: { type: Number, min: 1 },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

gtoDrillResultSchema.index({ drillId: 1, date: -1 });
gtoDrillResultSchema.index({ userId: 1, date: -1 });

export const GtoDrillResult = mongoose.model('GtoDrillResult', gtoDrillResultSchema);
