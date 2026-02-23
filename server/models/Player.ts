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

const stakeNoteSchema = new mongoose.Schema({
  stake: { type: Number, default: null },
  text: { type: String, required: true, default: '' },
});

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
    stakesSeenAt: {
      type: [Number],
      default: [],
      validate: {
        validator: (v: number[]) =>
          v.every((s) => STAKE_VALUES.includes(s as (typeof STAKE_VALUES)[number])),
        message: 'Invalid stake value',
      },
    },
    stakeNotes: {
      type: [stakeNoteSchema],
      default: [],
    },
    exploits: {
      type: [String],
      default: [],
    },
    rawNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

playerSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Player = mongoose.model('Player', playerSchema);
