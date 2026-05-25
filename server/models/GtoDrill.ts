import mongoose from 'mongoose';

const streetActionSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: true,
      enum: ['Preflop', 'Flop', 'Turn', 'River'],
    },
    sizing: { type: String, required: true, default: '', maxlength: 500 },
  },
  { _id: false }
);

const customConfigSchema = new mongoose.Schema(
  {
    streetActions: { type: [streetActionSchema], default: [] },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { _id: false }
);

const gtoDrillSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 500 },
    format: { type: String, required: true, enum: ['HU', '8max'] },
    stack: { type: String, required: true, enum: ['100bb', '200bb'] },
    handStart: { type: String, required: true, enum: ['Preflop', 'Postflop'] },
    street: {
      type: String,
      enum: ['Preflop', 'Flop', 'Turn', 'River'],
    },
    potType: {
      type: String,
      required: true,
      enum: ['Preflop', 'SRP', '3BP', '4BP', 'FoldedTo', 'Custom'],
    },
    heroPosition: { type: String, required: true },
    villainPosition: { type: String },
    endsAfter: {
      type: String,
      required: true,
      enum: ['FirstAction', 'StreetEnd', 'HandEnd'],
    },
    solver: {
      type: String,
      required: true,
      enum: ['Lucid', 'GTO Wizard', 'Solver Pro'],
      default: 'Lucid',
    },
    tier: { type: Number, min: 1, max: 3 },
    archived: { type: Boolean, default: false },
    customConfig: { type: customConfigSchema },
  },
  { timestamps: true }
);

gtoDrillSchema.index({ userId: 1, updatedAt: -1 });

export const GtoDrill = mongoose.model('GtoDrill', gtoDrillSchema);
