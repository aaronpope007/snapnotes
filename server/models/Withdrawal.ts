import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true }, // positive; money withdrawn
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1, date: -1 });

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
