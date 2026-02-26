import mongoose from 'mongoose';

export const PLAYER_TYPE_KEYS = [
  'whale',
  'calling_station',
  'nit',
  'maniac',
  'weak_tight_reg',
  'tag',
  'lag',
  'gto_grinder',
  'unknown',
] as const;

export const STAKE_VALUES = [200, 400, 800, 1000, 2000, 5000] as const;

const noteEntrySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, default: '' },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ['import'], default: undefined },
  },
  { _id: false }
);

const legacyStakeNoteSchema = new mongoose.Schema(
  { stake: { type: Number, default: null }, text: { type: String, default: '' } },
  { _id: false }
);

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      collation: { locale: 'en', strength: 2 },
    },
    playerType: {
      type: String,
      enum: PLAYER_TYPE_KEYS,
      default: 'unknown',
    },
    gameTypes: {
      type: [String],
      default: [],
    },
    stakesSeenAt: {
      type: [Number],
      default: [],
      validate: {
        validator: (v: number[]) =>
          v.every((s) => STAKE_VALUES.includes(s as (typeof STAKE_VALUES)[number])),
        message: 'Invalid stake value',
      },
    },
    formats: {
      type: [String],
      default: [],
    },
    origin: {
      type: String,
      default: 'WPT Gold',
    },
    notes: {
      type: [noteEntrySchema],
      default: [],
    },
    stakeNotes: {
      type: [legacyStakeNoteSchema],
      default: undefined,
    },
    rawNote: {
      type: String,
      default: undefined,
    },
    exploits: {
      type: [String],
      default: [],
    },
    handHistories: {
      type: [
        {
          title: { type: String, default: '' },
          content: { type: String, default: '' },
          spoilerText: { type: String, default: '' },
          comments: {
            type: [
              {
                text: { type: String, default: '' },
                addedBy: { type: String, required: true },
                addedAt: { type: Date, required: true, default: Date.now },
                editedAt: { type: Date, default: undefined },
                editedBy: { type: String, default: undefined },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    exploitHandExamples: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

playerSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Player = mongoose.model('Player', playerSchema);
