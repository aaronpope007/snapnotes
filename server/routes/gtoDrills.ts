import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { GtoDrill } from '../models/GtoDrill.js';
import { GtoDrillResult } from '../models/GtoDrillResult.js';
import {
  validateDrillFields,
  normalizeCustomConfig,
  parseDate,
  type GtoDrillBodyFields,
} from './gtoDrillValidation.js';

const router = Router();

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  const body = req.body as { userId?: string };
  return typeof body.userId === 'string' ? body.userId.trim() : undefined;
}

async function getDrillForUser(drillId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(drillId)) return null;
  return GtoDrill.findOne({ _id: drillId, userId });
}

// ─── Drills ─────────────────────────────────────────────────────────────────

const RECENT_RESULTS_SUMMARY_LIMIT = 6;

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });

    const withRecent =
      typeof req.query.recentResults === 'string' &&
      ['1', 'true', 'yes'].includes(req.query.recentResults.trim().toLowerCase());

    if (!withRecent) {
      const drills = await GtoDrill.find({ userId }).sort({ updatedAt: -1 }).lean();
      res.json(drills);
      return;
    }

    const resultCollName = GtoDrillResult.collection.collectionName;

    const pipeline = [
      { $match: { userId } },
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

    const drills = await GtoDrill.aggregate(pipeline);
    res.json(drills);
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

    const potType = body.potType as string;
    const drill = new GtoDrill({
      userId,
      name: body.name!.trim().slice(0, 120),
      format: body.format,
      stack: body.stack,
      handStart: body.handStart,
      potType,
      heroPosition: body.heroPosition,
      villainPosition:
        body.handStart === 'Postflop' && body.villainPosition?.trim()
          ? body.villainPosition.trim()
          : undefined,
      endsAfter: body.endsAfter,
      solver: body.solver ?? 'Lucid',
      customConfig: normalizeCustomConfig(potType, body.customConfig),
    });
    await drill.save();
    res.status(201).json(drill);
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
      format: body.format ?? drill.format,
      stack: body.stack ?? drill.stack,
      handStart: body.handStart ?? drill.handStart,
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

    drill.name = merged.name!.trim().slice(0, 120);
    drill.format = merged.format as 'HU' | '8max';
    drill.stack = merged.stack as '100bb' | '200bb';
    drill.handStart = merged.handStart as 'Preflop' | 'Postflop';
    drill.potType = merged.potType as 'SRP' | '3BP' | '4BP' | 'FoldedTo' | 'Custom';
    drill.heroPosition = merged.heroPosition!;
    drill.endsAfter = merged.endsAfter as 'FirstAction' | 'StreetEnd' | 'HandEnd';
    drill.solver = (merged.solver ?? 'Lucid') as 'Lucid' | 'GTO Wizard' | 'Solver Pro';

    if (merged.handStart === 'Postflop' && merged.villainPosition) {
      drill.villainPosition = merged.villainPosition;
    } else {
      drill.villainPosition = undefined;
    }

    drill.customConfig = normalizeCustomConfig(drill.potType, merged.customConfig) as
      | typeof drill.customConfig
      | undefined;

    await drill.save();
    res.json(drill);
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
