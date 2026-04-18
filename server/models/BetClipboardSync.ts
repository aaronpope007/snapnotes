import mongoose from 'mongoose';

const betClipboardSyncSchema = new mongoose.Schema(
  {
    syncId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: () => ({}),
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'betclipboardsyncs' }
);

betClipboardSyncSchema.pre('save', function setUpdatedAt(next) {
  this.set('updatedAt', new Date());
  next();
});

export const BetClipboardSync =
  mongoose.models.BetClipboardSync || mongoose.model('BetClipboardSync', betClipboardSyncSchema);
