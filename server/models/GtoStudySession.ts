import mongoose from 'mongoose';

const gtoStudySessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    sessionDate: { type: Date, required: true },
    format: { type: String, required: true, enum: ['HU', '8max'] },
    stack: { type: String, required: true, enum: ['100bb', '200bb'] },
    handStart: { type: String, required: true, enum: ['Preflop', 'Postflop'] },
    potType: {
      type: String,
      required: true,
      enum: ['SRP', '3BP', '4BP', 'Folded To', 'Custom'],
    },
    heroPosition: { type: String, required: true },
    villainPosition: { type: String },
    endsAfter: {
      type: String,
      required: true,
      enum: ['FirstAction', 'StreetEnd', 'HandEnd'],
    },
    evLoss: { type: Number },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

gtoStudySessionSchema.index({ userId: 1, sessionDate: -1 });

export const GtoStudySession = mongoose.model('GtoStudySession', gtoStudySessionSchema);
