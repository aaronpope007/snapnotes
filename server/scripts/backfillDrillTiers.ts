/**
 * One-time: set tier on drills that lack one, using legacy name matchers.
 * Run: npx tsx scripts/backfillDrillTiers.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { GtoDrill } from '../models/GtoDrill.js';

const TIERS: Array<{ tier: 1 | 2 | 3; matchers: string[] }> = [
  {
    tier: 1,
    matchers: ['preflop sb', 'preflop bb', 'srp cbet opportunity', 'srp vs cbet b33'],
  },
  {
    tier: 2,
    matchers: [
      'srp vs cbet b75',
      'srp vs cbet b150',
      'srp vs delay',
      'srp turn probe',
      'srp hero cbet',
      'delay cbet opportunity turn',
      'srp cbet b33, turn',
    ],
  },
  { tier: 3, matchers: ['3b pot'] },
];

function inferTier(name: string): 1 | 2 | 3 | null {
  const lower = name.toLowerCase();
  for (const { tier, matchers } of TIERS) {
    if (matchers.some((m) => lower.includes(m))) return tier;
  }
  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const drills = await GtoDrill.find({
    $or: [{ tier: { $exists: false } }, { tier: null }],
  }).lean();
  let updated = 0;
  for (const d of drills) {
    const tier = inferTier(d.name);
    if (tier == null) continue;
    await GtoDrill.updateOne({ _id: d._id }, { $set: { tier } });
    console.log(`Tier ${tier}: ${d.name}`);
    updated++;
  }
  console.log(`Updated ${updated} of ${drills.length} drills without a tier.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
