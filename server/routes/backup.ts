import { Router, Request, Response } from 'express';
import { Player } from '../models/Player.js';
import { HandToReview } from '../models/HandToReview.js';

const router = Router();

export interface BackupPayload {
  exportedAt: string;
  players: Record<string, unknown>[];
  handsToReview: Record<string, unknown>[];
}

// GET /api/backup/export — full dump of players and hands-to-review
router.get('/export', async (_req: Request, res: Response) => {
  try {
    const players = await Player.find().sort({ username: 1 }).collation({ locale: 'en', strength: 2 }).lean();
    const handsToReview = await HandToReview.find().sort({ createdAt: -1 }).lean();
    const payload: BackupPayload = {
      exportedAt: new Date().toISOString(),
      players: (players as Record<string, unknown>[]).map((p) => {
        const { __v, ...rest } = p;
        return rest;
      }),
      handsToReview: (handsToReview as Record<string, unknown>[]).map((h) => {
        const { __v, ...rest } = h;
        return rest;
      }),
    };
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export backup' });
  }
});

// POST /api/backup/restore — replace all data with backup (destructive)
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const body = req.body as { players?: unknown[]; handsToReview?: unknown[] };
    const players = Array.isArray(body.players) ? body.players : [];
    const handsToReview = Array.isArray(body.handsToReview) ? body.handsToReview : [];

    await Player.deleteMany({});
    await HandToReview.deleteMany({});

    if (players.length > 0) {
      const toInsert = players.map((p) => {
        const doc = p as Record<string, unknown>;
        const { __v, ...rest } = doc;
        return rest;
      });
      await Player.insertMany(toInsert);
    }
    if (handsToReview.length > 0) {
      const toInsert = handsToReview.map((h) => {
        const doc = h as Record<string, unknown>;
        const { __v, ...rest } = doc;
        return rest;
      });
      await HandToReview.insertMany(toInsert);
    }

    res.json({
      playersRestored: players.length,
      handsToReviewRestored: handsToReview.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

export default router;
