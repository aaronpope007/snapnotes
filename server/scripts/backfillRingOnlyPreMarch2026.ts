import 'dotenv/config';
import mongoose from 'mongoose';
import { SessionResult } from '../models/SessionResult.js';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to server/.env');
    process.exit(1);
  }

  const cutoff = new Date('2026-03-01T00:00:00.000Z');

  await mongoose.connect(uri);
  try {
    const match = { date: { $lt: cutoff } } as const;
    const update = { $set: { isRing: true, isHU: false } } as const;
    const res = await SessionResult.updateMany(match, update);
    console.log(`Backfill complete. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

