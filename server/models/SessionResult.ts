import mongoose from 'mongoose';

const sessionResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    totalTime: { type: Number, default: null }, // hours (decimal)
    hands: { type: Number, default: null },
    handsStartedAt: { type: Number, default: null },
    handsEndedAt: { type: Number, default: null },
    dailyNet: { type: Number, default: null }, // profit/loss in dollars
    startBankroll: { type: Number, default: null }, // bankroll $ at start of session
    endBankroll: { type: Number, default: null }, // bankroll $ at end of session (for next session's start bankroll)
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    stake: { type: Number, default: null },
    isRing: { type: Boolean, default: null },
    isHU: { type: Boolean, default: null },
    gameType: { type: String, enum: ['NLHE', 'PLO'], default: 'NLHE' },
    rating: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: null },
  },
  { timestamps: true }
);

sessionResultSchema.index({ userId: 1, date: -1 });

export const SessionResult = mongoose.model('SessionResult', sessionResultSchema);
