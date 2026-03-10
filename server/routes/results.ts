import { Router, Request, Response } from 'express';
import { SessionResult } from '../models/SessionResult.js';

const router = Router();

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  const body = req.body as { userId?: string };
  return typeof body.userId === 'string' ? body.userId.trim() : undefined;
}

/** Parse a value that might be "$102.00" or "-$215.00" or 102 or -215 */
function parseDailyNet(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const s = String(val).trim();
  if (!s) return null;
  const cleaned = s.replace(/[$,]/g, '');
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

/** Parse date from MM/DD/YYYY, YYYY-MM-DD, or ISO string. Date-only strings (YYYY-MM-DD) are stored at noon UTC to avoid timezone shifts when displaying. */
function parseDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  const s = String(val).trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const month = parseInt(m[1], 10) - 1;
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const isoOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoOnly) {
    const d = new Date(s + 'T12:00:00.000Z');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// GET /api/results?userId=...
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const sessions = await SessionResult.find({ userId })
      .sort({ date: -1 })
      .lean();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// POST /api/results - create one session
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId?: string;
      date?: string;
      totalTime?: number | null;
      hands?: number | null;
      handsStartedAt?: number | null;
      handsEndedAt?: number | null;
      dailyNet?: number | null;
      startBankroll?: number | null;
      endBankroll?: number | null;
      startTime?: string | null;
      endTime?: string | null;
      stake?: number | null;
      isRing?: boolean | null;
      isHU?: boolean | null;
      gameType?: 'NLHE' | 'PLO';
      rating?: 'A' | 'B' | 'C' | 'D' | 'F' | null;
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const dateVal = body.date ? parseDate(body.date) : new Date();
    if (!dateVal) return res.status(400).json({ error: 'Invalid date' });

    const handsStartedAt = body.handsStartedAt ?? null;
    const handsEndedAt = body.handsEndedAt ?? null;
    let hands = body.hands ?? null;
    if (hands == null && handsStartedAt != null && handsEndedAt != null) {
      hands = handsEndedAt - handsStartedAt;
    }

    const session = new SessionResult({
      userId,
      date: dateVal,
      totalTime: body.totalTime ?? null,
      hands,
      handsStartedAt,
      handsEndedAt,
      dailyNet: body.dailyNet ?? null,
      startBankroll: body.startBankroll ?? null,
      endBankroll: body.endBankroll ?? null,
      startTime: body.startTime ? new Date(body.startTime) : null,
      endTime: body.endTime ? new Date(body.endTime) : null,
      stake: body.stake ?? null,
      isRing: body.isRing ?? null,
      isHU: body.isHU ?? null,
      gameType: body.gameType ?? 'NLHE',
      rating: body.rating && ['A', 'B', 'C', 'D', 'F'].includes(body.rating) ? body.rating : null,
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create session';
    res.status(400).json({ error: message });
  }
});

// POST /api/results/upload - bulk import (Date, total time, hands, Daily Net; all optional except date)
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId?: string;
      sessions?: Array<{
        date?: string | number | Date;
        totalTime?: number | string | null;
        hands?: number | string | null;
        handsStartedAt?: number | string | null;
        handsEndedAt?: number | string | null;
        dailyNet?: number | string | null;
        endBankroll?: number | string | null;
      }>;
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const raw = body.sessions;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ error: 'sessions array required and must not be empty' });
    }

    const toInsert: Array<{
      userId: string;
      date: Date;
      totalTime: number | null;
      hands: number | null;
      handsStartedAt: number | null;
      handsEndedAt: number | null;
      dailyNet: number | null;
      endBankroll: number | null;
    }> = [];

    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      const dateVal = parseDate(row?.date);
      if (!dateVal) continue; // skip rows with no valid date
      const totalTime =
        row?.totalTime != null && row.totalTime !== ''
          ? Number(row.totalTime)
          : null;
      let hands =
        row?.hands != null && row.hands !== '' ? Number(row.hands) : null;
      const handsStartedAt =
        row?.handsStartedAt != null && row.handsStartedAt !== ''
          ? Number(row.handsStartedAt)
          : null;
      const handsEndedAt =
        row?.handsEndedAt != null && row.handsEndedAt !== ''
          ? Number(row.handsEndedAt)
          : null;
      if (hands == null && handsStartedAt != null && handsEndedAt != null && !Number.isNaN(handsStartedAt) && !Number.isNaN(handsEndedAt)) {
        hands = handsEndedAt - handsStartedAt;
      }
      const dailyNet = parseDailyNet(row?.dailyNet);
      const endBankroll =
        row?.endBankroll != null && row.endBankroll !== ''
          ? Number(String(row.endBankroll).replace(/[$,]/g, ''))
          : null;
      toInsert.push({
        userId,
        date: dateVal,
        totalTime: typeof totalTime === 'number' && !Number.isNaN(totalTime) ? totalTime : null,
        hands: typeof hands === 'number' && !Number.isNaN(hands) && Number.isInteger(hands) ? hands : null,
        handsStartedAt: typeof handsStartedAt === 'number' && !Number.isNaN(handsStartedAt) && Number.isInteger(handsStartedAt) ? handsStartedAt : null,
        handsEndedAt: typeof handsEndedAt === 'number' && !Number.isNaN(handsEndedAt) && Number.isInteger(handsEndedAt) ? handsEndedAt : null,
        dailyNet,
        endBankroll: typeof endBankroll === 'number' && !Number.isNaN(endBankroll) ? endBankroll : null,
      });
    }

    if (toInsert.length === 0) {
      return res.status(400).json({ error: 'No valid rows (each row needs a valid date)' });
    }

    const inserted = await SessionResult.insertMany(toInsert);
    res.status(201).json({ count: inserted.length, sessions: inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upload sessions';
    res.status(400).json({ error: message });
  }
});

// DELETE /api/results/all?userId=... - delete all sessions for user
router.delete('/all', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const result = await SessionResult.deleteMany({ userId });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete results' });
  }
});

// PATCH /api/results/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const session = await SessionResult.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const body = req.body as {
      date?: string;
      totalTime?: number | null;
      hands?: number | null;
      handsStartedAt?: number | null;
      handsEndedAt?: number | null;
      dailyNet?: number | null;
      startBankroll?: number | null;
      endBankroll?: number | null;
      startTime?: string | null;
      endTime?: string | null;
      stake?: number | null;
      isRing?: boolean | null;
      isHU?: boolean | null;
      gameType?: 'NLHE' | 'PLO';
      rating?: 'A' | 'B' | 'C' | 'D' | 'F' | null;
    };
    if (body.date !== undefined) {
      const d = parseDate(body.date);
      if (d) session.date = d;
    }
    if (body.totalTime !== undefined) session.totalTime = body.totalTime;
    if (body.hands !== undefined) session.hands = body.hands;
    if (body.handsStartedAt !== undefined) session.handsStartedAt = body.handsStartedAt;
    if (body.handsEndedAt !== undefined) session.handsEndedAt = body.handsEndedAt;
    if (body.dailyNet !== undefined) session.dailyNet = body.dailyNet;
    if (body.startBankroll !== undefined) session.startBankroll = body.startBankroll;
    if (body.endBankroll !== undefined) session.endBankroll = body.endBankroll;
    if (body.startTime !== undefined) session.startTime = body.startTime ? new Date(body.startTime) : null;
    if (body.endTime !== undefined) session.endTime = body.endTime ? new Date(body.endTime) : null;
    if (body.stake !== undefined) session.stake = body.stake;
    if (body.isRing !== undefined) session.isRing = body.isRing;
    if (body.isHU !== undefined) session.isHU = body.isHU;
    if (body.gameType !== undefined && ['NLHE', 'PLO'].includes(body.gameType)) {
      session.gameType = body.gameType;
    }
    if (body.rating !== undefined) {
      session.rating = body.rating && ['A', 'B', 'C', 'D', 'F'].includes(body.rating) ? body.rating : null;
    }
    await session.save();
    res.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update session';
    res.status(400).json({ error: message });
  }
});

// DELETE /api/results/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const session = await SessionResult.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
