import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { GtoDrill } from '../models/GtoDrill.js';
import { GtoDrillResult } from '../models/GtoDrillResult.js';
import {
  validateDrillFields,
  normalizeCustomConfig,
  normalizeDrillDescription,
  normalizeDrillStreet,
  normalizeStudyTier,
  normalizeSolver,
  parseDate,
  type GtoDrillBodyFields,
} from './gtoDrillValidation.js';

function withNormalizedSolver<T extends { solver?: string }>(drill: T): T {
  if (!drill.solver) return drill;
  return { ...drill, solver: normalizeSolver(drill.solver) };
}

function withNormalizedSolverList<T extends { solver?: string }>(drills: T[]): T[] {
  return drills.map(withNormalizedSolver);
}

const router = Router();

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  const body = req.body as { userId?: string };
  return typeof body.userId === 'string' ? body.userId.trim() : undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive name match within a user's drills. */
async function findDrillWithName(
  userId: string,
  name: string,
  excludeId?: string
) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const filter: Record<string, unknown> = {
    userId,
    name: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' },
  };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }
  return GtoDrill.findOne(filter).select('_id name').lean();
}

async function getDrillForUser(drillId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(drillId)) return null;
  return GtoDrill.findOne({ _id: drillId, userId });
}

// ─── Drills ─────────────────────────────────────────────────────────────────

const RECENT_RESULTS_SUMMARY_LIMIT = 6;

/** Active drills: archived false, null, or missing. */
function activeDrillsMatch(userId: string) {
  return { userId, archived: { $ne: true } };
}

function archivedDrillsMatch(userId: string) {
  return { userId, archived: true };
}

function parseFormatQuery(req: Request): 'HU' | '8max' | undefined {
  const q = typeof req.query.format === 'string' ? req.query.format.trim() : '';
  if (q === 'HU' || q === '8max') return q;
  return undefined;
}

function withFormatFilter(
  match: Record<string, unknown>,
  format: 'HU' | '8max' | undefined
): Record<string, unknown> {
  if (!format) return match;
  return { ...match, format };
}

function wantsRecentResultsSummary(req: Request): boolean {
  return (
    typeof req.query.recentResults === 'string' &&
    ['1', 'true', 'yes'].includes(req.query.recentResults.trim().toLowerCase())
  );
}

async function listDrillsForUser(
  userId: string,
  match: Record<string, unknown>,
  withRecent: boolean
) {
  if (!withRecent) {
    return GtoDrill.find(match).sort({ updatedAt: -1 }).lean();
  }

  const resultCollName = GtoDrillResult.collection.collectionName;

  const pipeline = [
    { $match: match },
    { $sort: { updatedAt: -1 } },
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
          { $sort: { date: -1 } },
          { $limit: RECENT_RESULTS_SUMMARY_LIMIT },
          {
            $project: {
              _id: { $toString: '$_id' },
              date: 1,
              evLoss: 1,
              handsPlayed: 1,
              accuracy: 1,
              evDiff: 1,
              score: 1,
            },
          },
        ],
        as: 'recentResultsSummary',
      },
    },
  ];

  return GtoDrill.aggregate(pipeline);
}

router.get('/archived', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });

    const format = parseFormatQuery(req);
    const drills = await listDrillsForUser(
      userId,
      withFormatFilter(archivedDrillsMatch(userId), format),
      wantsRecentResultsSummary(req)
    );
    res.json(withNormalizedSolverList(drills));
  } catch {
    res.status(500).json({ error: 'Failed to fetch archived GTO drills' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });

    const format = parseFormatQuery(req);
    const drills = await listDrillsForUser(
      userId,
      withFormatFilter(activeDrillsMatch(userId), format),
      wantsRecentResultsSummary(req)
    );
    res.json(withNormalizedSolverList(drills));
  } catch {
    res.status(500).json({ error: 'Failed to fetch GTO drills' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as GtoDrillBodyFields & { userId?: string };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const validationError = validateDrillFields(body, true);
    if (validationError) return res.status(400).json({ error: validationError });

    const drillName = body.name!.trim().slice(0, 120);
    const duplicate = await findDrillWithName(userId, drillName);
    if (duplicate) {
      return res.status(409).json({ error: 'A drill with this name already exists' });
    }

    const potType = body.potType as string;
    const drill = new GtoDrill({
      userId,
      name: drillName,
      description: normalizeDrillDescription(body.description),
      format: body.format,
      stack: body.stack,
      handStart: body.handStart,
      street: normalizeDrillStreet(body.handStart as string, body.street),
      potType,
      heroPosition: body.heroPosition,
      villainPosition:
        body.handStart === 'Postflop' && body.villainPosition?.trim()
          ? body.villainPosition.trim()
          : undefined,
      endsAfter: body.endsAfter,
      solver: normalizeSolver(body.solver),
      tier: normalizeStudyTier(body.tier),
      customConfig: normalizeCustomConfig(potType, body.customConfig),
    });
    await drill.save();
    res.status(201).json(withNormalizedSolver(drill.toObject()));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create GTO drill';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const drill = await GtoDrill.findById(req.params.id);
    if (!drill) return res.status(404).json({ error: 'GTO drill not found' });
    if (userId && drill.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const body = req.body as GtoDrillBodyFields;

    const merged: GtoDrillBodyFields = {
      name: body.name !== undefined ? body.name : drill.name,
      description:
        body.description !== undefined ? body.description : drill.description,
      format: body.format ?? drill.format,
      stack: body.stack ?? drill.stack,
      handStart: body.handStart ?? drill.handStart,
      street: body.street ?? drill.street,
      potType: body.potType ?? drill.potType,
      heroPosition: body.heroPosition ?? drill.heroPosition,
      villainPosition:
        body.villainPosition !== undefined
          ? body.villainPosition === null
            ? undefined
            : body.villainPosition
          : drill.villainPosition,
      endsAfter: body.endsAfter ?? drill.endsAfter,
      solver: body.solver ?? drill.solver,
      tier: body.tier !== undefined ? body.tier : drill.tier,
      customConfig:
        body.customConfig !== undefined
          ? body.customConfig
          : drill.customConfig
            ? {
                streetActions: drill.customConfig.streetActions,
                notes: drill.customConfig.notes,
              }
            : undefined,
    };

    const validationError = validateDrillFields(merged, true);
    if (validationError) return res.status(400).json({ error: validationError });

    const drillName = merged.name!.trim().slice(0, 120);
    const duplicate = await findDrillWithName(drill.userId, drillName, String(drill._id));
    if (duplicate) {
      return res.status(409).json({ error: 'A drill with this name already exists' });
    }

    drill.name = drillName;
    drill.description = normalizeDrillDescription(merged.description) ?? '';
    drill.format = merged.format as 'HU' | '8max';
    drill.stack = merged.stack as '100bb' | '200bb';
    drill.handStart = merged.handStart as 'Preflop' | 'Postflop';
    drill.street = normalizeDrillStreet(
      merged.handStart as string,
      merged.street ?? drill.street
    ) as 'Preflop' | 'Flop' | 'Turn' | 'River';
    drill.potType = merged.potType as
      | 'Preflop'
      | 'SRP'
      | '3BP'
      | '4BP'
      | 'FoldedTo'
      | 'Custom';
    drill.heroPosition = merged.heroPosition!;
    drill.endsAfter = merged.endsAfter as 'FirstAction' | 'StreetEnd' | 'HandEnd';
    drill.solver = normalizeSolver(merged.solver ?? drill.solver);
    if (body.tier !== undefined) {
      const t = normalizeStudyTier(body.tier);
      if (t == null) drill.set('tier', undefined);
      else drill.tier = t;
    }

    if (merged.handStart === 'Postflop' && merged.villainPosition) {
      drill.villainPosition = merged.villainPosition;
    } else {
      drill.villainPosition = undefined;
    }

    drill.customConfig = normalizeCustomConfig(drill.potType, merged.customConfig) as
      | typeof drill.customConfig
      | undefined;

    if (body.archived !== undefined) {
      drill.archived = Boolean(body.archived);
    }

    await drill.save();
    res.json(withNormalizedSolver(drill.toObject()));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update GTO drill';
    res.status(400).json({ error: message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const drill = await GtoDrill.findByIdAndDelete(req.params.id);
    if (!drill) return res.status(404).json({ error: 'GTO drill not found' });
    await GtoDrillResult.deleteMany({ drillId: drill._id });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete GTO drill' });
  }
});

// ─── Results ────────────────────────────────────────────────────────────────

const RECENT_RESULTS_FEED_DEFAULT = 40;
const RECENT_RESULTS_FEED_MAX = 100;

function parseRecentResultsLimit(req: Request): number {
  const raw = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : NaN;
  if (!Number.isFinite(raw) || raw < 1) return RECENT_RESULTS_FEED_DEFAULT;
  return Math.min(raw, RECENT_RESULTS_FEED_MAX);
}

/** Recent results across all drills (newest first), with drill name for history browsing. */
router.get('/results/recent', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });

    const format = parseFormatQuery(req);
    const limit = parseRecentResultsLimit(req);
    const drillCollName = GtoDrill.collection.collectionName;

    const pipeline: Record<string, unknown>[] = [
      { $match: { userId } },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: drillCollName,
          localField: 'drillId',
          foreignField: '_id',
          as: 'drill',
        },
      },
      { $unwind: '$drill' },
    ];

    if (format) {
      pipeline.push({ $match: { 'drill.format': format } });
    }

    pipeline.push(
      { $limit: limit },
      {
        $project: {
          _id: { $toString: '$_id' },
          drillId: { $toString: '$drillId' },
          userId: 1,
          date: 1,
          evLoss: 1,
          handsPlayed: 1,
          accuracy: 1,
          bestActionRate: 1,
          evDiff: 1,
          score: 1,
          notes: 1,
          studySessionId: 1,
          createdAt: 1,
          updatedAt: 1,
          drillName: '$drill.name',
          drillFormat: '$drill.format',
          drillArchived: { $ifNull: ['$drill.archived', false] },
        },
      }
    );

    const rows = await GtoDrillResult.aggregate(pipeline);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch recent drill results' });
  }
});

router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const drill = await getDrillForUser(req.params.id, userId);
    if (!drill) return res.status(404).json({ error: 'GTO drill not found' });
    const results = await GtoDrillResult.find({ drillId: drill._id, userId })
      .sort({ date: -1 })
      .lean();
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Failed to fetch drill results' });
  }
});

function parseHandsPlayed(value: unknown): number | undefined | 'invalid' {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalid';
  const n = Math.floor(value);
  if (n < 1) return 'invalid';
  return n;
}

/** 0–100 inclusive when present. */
function parseAccuracy(value: unknown): number | undefined | 'invalid' {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalid';
  if (value < 0 || value > 100) return 'invalid';
  return value;
}

function parseEvDiff(value: unknown): number | undefined | 'invalid' {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalid';
  return value;
}

/** Strictly positive when present. */
function parseScore(value: unknown): number | undefined | 'invalid' {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalid';
  if (value <= 0) return 'invalid';
  return value;
}

router.post('/:id/results', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId?: string;
      date?: string;
      evLoss?: number;
      handsPlayed?: number;
      accuracy?: number;
      bestActionRate?: number;
      evDiff?: number;
      score?: number;
      notes?: string;
      studySessionId?: string;
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const drill = await getDrillForUser(req.params.id, userId);
    if (!drill) return res.status(404).json({ error: 'GTO drill not found' });

    const date = parseDate(body.date) ?? new Date();
    const evLoss =
      typeof body.evLoss === 'number' && Number.isFinite(body.evLoss) ? body.evLoss : undefined;
    const handsPlayed = parseHandsPlayed(body.handsPlayed);
    if (handsPlayed === 'invalid') {
      return res.status(400).json({ error: 'handsPlayed must be a positive integer' });
    }

    const accuracy = parseAccuracy(body.accuracy);
    if (accuracy === 'invalid') {
      return res.status(400).json({ error: 'accuracy must be between 0 and 100' });
    }
    const bestActionRate = parseAccuracy(body.bestActionRate);
    if (bestActionRate === 'invalid') {
      return res.status(400).json({ error: 'bestActionRate must be between 0 and 100' });
    }
    const evDiff = parseEvDiff(body.evDiff);
    if (evDiff === 'invalid') {
      return res.status(400).json({ error: 'evDiff must be a finite number' });
    }
    const score = parseScore(body.score);
    if (score === 'invalid') {
      return res.status(400).json({ error: 'score must be a positive number' });
    }

    const result = new GtoDrillResult({
      drillId: drill._id,
      userId,
      date,
      evLoss,
      handsPlayed,
      accuracy,
      bestActionRate,
      evDiff,
      score,
      notes: (body.notes ?? '').trim().slice(0, 500),
      studySessionId:
        typeof body.studySessionId === 'string' && body.studySessionId.trim()
          ? body.studySessionId.trim()
          : undefined,
    });
    await result.save();
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create drill result';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id/results/:resultId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const drill = await getDrillForUser(req.params.id, userId);
    if (!drill) return res.status(404).json({ error: 'GTO drill not found' });

    if (!mongoose.Types.ObjectId.isValid(req.params.resultId)) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const result = await GtoDrillResult.findOne({
      _id: req.params.resultId,
      drillId: drill._id,
      userId,
    });
    if (!result) return res.status(404).json({ error: 'Result not found' });

    const body = req.body as {
      date?: string;
      evLoss?: number | null;
      handsPlayed?: number | null;
      accuracy?: number | null;
      bestActionRate?: number | null;
      evDiff?: number | null;
      score?: number | null;
      notes?: string;
    };

    if (body.date !== undefined) {
      const d = parseDate(body.date);
      if (!d) return res.status(400).json({ error: 'invalid date' });
      result.date = d;
    }
    if (body.evLoss !== undefined) {
      result.evLoss =
        body.evLoss == null
          ? undefined
          : typeof body.evLoss === 'number' && Number.isFinite(body.evLoss)
            ? body.evLoss
            : result.evLoss;
    }
    if (body.handsPlayed !== undefined) {
      const handsPlayed = parseHandsPlayed(body.handsPlayed);
      if (handsPlayed === 'invalid') {
        return res.status(400).json({ error: 'handsPlayed must be a positive integer' });
      }
      result.handsPlayed = handsPlayed;
    }
    if (body.accuracy !== undefined) {
      if (body.accuracy == null) {
        result.accuracy = undefined;
      } else {
        const accuracy = parseAccuracy(body.accuracy);
        if (accuracy === 'invalid') {
          return res.status(400).json({ error: 'accuracy must be between 0 and 100' });
        }
        result.accuracy = accuracy;
      }
    }
    if (body.bestActionRate !== undefined) {
      if (body.bestActionRate == null) {
        result.bestActionRate = undefined;
      } else {
        const bestActionRate = parseAccuracy(body.bestActionRate);
        if (bestActionRate === 'invalid') {
          return res.status(400).json({ error: 'bestActionRate must be between 0 and 100' });
        }
        result.bestActionRate = bestActionRate;
      }
    }
    if (body.evDiff !== undefined) {
      if (body.evDiff == null) {
        result.evDiff = undefined;
      } else {
        const evDiff = parseEvDiff(body.evDiff);
        if (evDiff === 'invalid') {
          return res.status(400).json({ error: 'evDiff must be a finite number' });
        }
        result.evDiff = evDiff;
      }
    }
    if (body.score !== undefined) {
      if (body.score == null) {
        result.score = undefined;
      } else {
        const score = parseScore(body.score);
        if (score === 'invalid') {
          return res.status(400).json({ error: 'score must be a positive number' });
        }
        result.score = score;
      }
    }
    if (body.notes !== undefined) {
      result.notes = body.notes.trim().slice(0, 500);
    }

    await result.save();
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update drill result';
    res.status(400).json({ error: message });
  }
});

router.delete('/:id/results/:resultId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const drill = await getDrillForUser(req.params.id, userId);
    if (!drill) return res.status(404).json({ error: 'GTO drill not found' });

    const result = await GtoDrillResult.findOneAndDelete({
      _id: req.params.resultId,
      drillId: drill._id,
      userId,
    });
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete drill result' });
  }
});

export default router;
