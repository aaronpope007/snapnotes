import 'dotenv/config';
import mongoose from 'mongoose';
import { GtoDrill } from '../models/GtoDrill.js';

const FIXES: Array<{
  name: string;
  stack?: '100bb' | '200bb';
  endsAfter?: 'StreetEnd' | 'HandEnd';
}> = [
  { name: '100hu 3b pot facing b107 cbet flop rest of hand', stack: '100bb' },
  { name: '100hu 3b pot facing b25 cbet flop rest of hand', stack: '100bb' },
  { name: '100hu 3b pot facing b50 cbet flop only', stack: '100bb' },
  { name: '200hu 3b pot facing b75 cbet flop only', stack: '200bb' },
  {
    name: '200hu 3b pot float flop b33, turn opportunity rest of hand',
    stack: '200bb',
    endsAfter: 'HandEnd',
  },
  { name: '200hu 3b pot hero b75/call turn street only', stack: '200bb' },
  { name: '100hu 3b pot facing b50 cbet flop rest of hand', endsAfter: 'HandEnd' },
  {
    name: '200hu 3b pot float flop b75, turn opportunity rest of hand',
    endsAfter: 'HandEnd',
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  for (const fix of FIXES) {
    const updates: Record<string, string> = {};
    if (fix.stack) updates.stack = fix.stack;
    if (fix.endsAfter) updates.endsAfter = fix.endsAfter;

    const result = await GtoDrill.updateOne({ name: fix.name }, { $set: updates });
    if (result.matchedCount === 0) {
      console.error(`NOT FOUND: ${fix.name}`);
      continue;
    }
    console.log(`Updated: ${fix.name} → ${JSON.stringify(updates)}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
