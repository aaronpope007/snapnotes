import mongoose from 'mongoose';

export const PLAYER_TYPES = [
  'Whale',
  'Calling Station',
  'Rock',
  'Maniac',
  'Weak-Tight Reg',
  'TAG',
  'LAG',
  'GTO Grinder',
  'Unknown',
] as const;

export type PlayerType = (typeof PLAYER_TYPES)[number];

export const STAKE_VALUES = [25, 50, 100, 200, 400, 800] as const;

const playerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    playerType: {
      type: String,
      enum: PLAYER_TYPES,
      default: 'Unknown',
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
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Player = mongoose.model('Player', playerSchema);
