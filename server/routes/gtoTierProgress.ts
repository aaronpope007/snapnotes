import { Router, Request, Response } from 'express';
import { GtoDrill } from '../models/GtoDrill.js';
import { GtoDrillResult } from '../models/GtoDrillResult.js';

const router = Router();

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  return undefined;
}

export interface GtoTierProgressRow {
  drillId: string;
  name: string;
  potType: string;
  street: string;
  heroPosition: string;
  endsAfter: string;
  stack: string;
  tier: number | null;
  latestScore: number | null;
  latestHandsPlayed: number | null;
  latestAccuracy: number | null;
  latestDate: string | null;
  timesLogged: number;
  recentScores: number[];
}

function parseFormatQuery(req: Request): 'HU' | '8max' {
  const q = typeof req.query.format === 'string' ? req.query.format.trim() : '';
  return q === '8max' ? '8max' : 'HU';
}

router.get('/tier-progress', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });

    const format = parseFormatQuery(req);
    const resultCollName = GtoDrillResult.collection.collectionName;

    const rows = await GtoDrill.aggregate([
      { $match: { userId, archived: { $ne: true }, format } },
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: resultCollName,
          let: { dId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$drillId', '$$dId'] }, { $eq: ['$userId', userId] }],
                },
              },
            },
            {
              $facet: {
                recent: [{ $sort: { date: -1 } }, { $limit: 5 }],
                total: [{ $count: 'count' }],
              },
            },
          ],
          as: 'resultMeta',
        },
      },
      {
        $addFields: {
          resultFacet: { $arrayElemAt: ['$resultMeta', 0] },
        },
      },
      {
        $project: {
          drillId: { $toString: '$_id' },
          name: 1,
          potType: 1,
          street: {
            $ifNull: [
              '$street',
              { $cond: [{ $eq: ['$handStart', 'Preflop'] }, 'Preflop', 'Flop'] },
            ],
          },
          heroPosition: 1,
          endsAfter: 1,
          stack: 1,
          tier: 1,
          timesLogged: {
            $ifNull: [{ $arrayElemAt: ['$resultFacet.total.count', 0] }, 0],
          },
          latestResult: { $arrayElemAt: ['$resultFacet.recent', 0] },
          recentScoreDocs: '$resultFacet.recent',
        },
      },
      {
        $project: {
          drillId: 1,
          name: 1,
          potType: 1,
          street: 1,
          heroPosition: 1,
          endsAfter: 1,
          stack: 1,
          tier: 1,
          timesLogged: 1,
          latestScore: '$latestResult.score',
          latestHandsPlayed: '$latestResult.handsPlayed',
          latestAccuracy: '$latestResult.accuracy',
          latestDate: '$latestResult.date',
          recentScoreDocs: 1,
        },
      },
    ]);

    const payload: GtoTierProgressRow[] = rows.map((row) => ({
      drillId: String(row.drillId),
      name: String(row.name),
      potType: String(row.potType),
      street: String(row.street),
      heroPosition: String(row.heroPosition),
      endsAfter: String(row.endsAfter),
      stack: String(row.stack),
      tier:
        row.tier != null && Number.isFinite(Number(row.tier)) && [1, 2, 3].includes(Number(row.tier))
          ? (Number(row.tier) as 1 | 2 | 3)
          : null,
      timesLogged: Number(row.timesLogged) || 0,
      latestScore:
        row.latestScore != null && Number.isFinite(Number(row.latestScore))
          ? Number(row.latestScore)
          : null,
      latestHandsPlayed:
        row.latestHandsPlayed != null && Number.isFinite(Number(row.latestHandsPlayed))
          ? Number(row.latestHandsPlayed)
          : null,
      latestAccuracy:
        row.latestAccuracy != null && Number.isFinite(Number(row.latestAccuracy))
          ? Number(row.latestAccuracy)
          : null,
      latestDate:
        row.latestDate instanceof Date
          ? row.latestDate.toISOString()
          : row.latestDate
            ? String(row.latestDate)
            : null,
      recentScores: (
        (row.recentScoreDocs as Array<{ score?: number; handsPlayed?: number }> | undefined) ??
        []
      )
        .map((r) => {
          const score = r.score;
          const hands = r.handsPlayed;
          if (
            score == null ||
            hands == null ||
            !Number.isFinite(Number(score)) ||
            !Number.isFinite(Number(hands)) ||
            Number(hands) < 1
          ) {
            return null;
          }
          const perHand = Number(score) / Number(hands);
          return Number.isFinite(perHand) ? Math.round(perHand * 1000) / 1000 : null;
        })
        .filter((s): s is number => s != null),
    }));

    res.json(payload);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tier progress' });
  }
});

export default router;
