import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Leak } from '../models/Leak.js';
import { Edge } from '../models/Edge.js';
import { MentalGameEntry } from '../models/MentalGameEntry.js';

const router = Router();
const REVIEW_INTERVALS_DAYS = [7, 30, 90];

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  const body = req.body as { userId?: string };
  return typeof body.userId === 'string' ? body.userId.trim() : undefined;
}

function advanceReview(leak: { reviewStage?: number }): { reviewStage: number; nextReviewAt?: Date } {
  const nextStage = (leak.reviewStage ?? 0) + 1;
  if (nextStage > 3) {
    return { reviewStage: 3, nextReviewAt: undefined };
  }
  const daysUntilNext = REVIEW_INTERVALS_DAYS[nextStage - 1];
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + daysUntilNext);
  return { reviewStage: nextStage, nextReviewAt };
}

// ─── Leaks ─────────────────────────────────────────────────────────────────
router.get('/leaks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const status = req.query.status as string | undefined;
    const playerId = typeof req.query.playerId === 'string' ? req.query.playerId.trim() : undefined;
    const filter: Record<string, unknown> = { userId };
    if (status && ['identified', 'working', 'resolved'].includes(status)) {
      filter.status = status;
    }
    if (playerId) filter.playerId = playerId;
    const leaks = await Leak.find(filter).sort({ createdAt: -1 }).lean();
    res.json(leaks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaks' });
  }
});

router.post('/leaks', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId: string;
      title: string;
      description?: string;
      category?: string;
      linkedHandIds?: string[];
      playerId?: string;
      playerUsername?: string;
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const linkedHandIds = Array.isArray(body.linkedHandIds)
      ? body.linkedHandIds.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
      : [];
    const leak = new Leak({
      userId,
      title: (body.title ?? '').trim() || 'Untitled leak',
      description: (body.description ?? '').trim(),
      category: body.category ?? 'other',
      status: 'identified',
      linkedHandIds,
      playerId: body.playerId?.trim() || undefined,
      playerUsername: body.playerUsername?.trim() || undefined,
    });
    await leak.save();
    res.status(201).json(leak);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create leak' });
  }
});

router.patch('/leaks/:id', async (req: Request, res: Response) => {
  try {
    const leak = await Leak.findById(req.params.id);
    if (!leak) return res.status(404).json({ error: 'Leak not found' });
    const body = req.body as {
      title?: string;
      description?: string;
      category?: string;
      status?: 'identified' | 'working' | 'resolved';
      linkedHandIds?: string[];
      notes?: { _id?: string; content: string; createdAt?: Date }[];
    };
    if (body.title !== undefined) leak.title = body.title.trim() || 'Untitled leak';
    if (body.description !== undefined) leak.description = body.description.trim();
    if (body.category !== undefined) leak.category = body.category as string;
    if (body.status !== undefined && ['identified', 'working', 'resolved'].includes(body.status)) {
      const wasResolved = leak.status === 'resolved';
      leak.status = body.status;
      if (body.status === 'resolved' && !wasResolved) {
        leak.resolvedAt = new Date();
        leak.reviewStage = 0;
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + REVIEW_INTERVALS_DAYS[0]);
        leak.nextReviewAt = nextReviewAt;
      } else if (body.status !== 'resolved') {
        leak.resolvedAt = undefined;
        leak.nextReviewAt = undefined;
        leak.reviewStage = 0;
      }
    }
    if (Array.isArray(body.linkedHandIds)) {
      leak.linkedHandIds = body.linkedHandIds.filter(
        (id): id is string => typeof id === 'string' && id.trim() !== ''
      );
    }
    if (Array.isArray(body.notes)) {
      leak.notes = body.notes.map((n) => ({
        _id: n._id ?? new mongoose.Types.ObjectId(),
        content: (n.content ?? '').trim(),
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
      }));
    }
    await leak.save();
    res.json(leak);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update leak' });
  }
});

router.delete('/leaks/:id', async (req: Request, res: Response) => {
  try {
    const leak = await Leak.findByIdAndDelete(req.params.id);
    if (!leak) return res.status(404).json({ error: 'Leak not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leak' });
  }
});

router.patch('/leaks/:id/review', async (req: Request, res: Response) => {
  try {
    const leak = await Leak.findById(req.params.id);
    if (!leak) return res.status(404).json({ error: 'Leak not found' });
    const body = req.body as { stillFixed?: boolean };
    const stillFixed = body.stillFixed !== false;
    if (stillFixed) {
      const next = advanceReview(leak);
      leak.reviewStage = next.reviewStage as 0 | 1 | 2 | 3;
      leak.nextReviewAt = next.nextReviewAt ?? undefined;
    } else {
      leak.status = 'working';
      leak.resolvedAt = undefined;
      leak.nextReviewAt = undefined;
      leak.reviewStage = 0;
    }
    await leak.save();
    res.json(leak);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update leak review' });
  }
});

// ─── Edges ─────────────────────────────────────────────────────────────────
router.get('/edges', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = { userId };
    if (status && ['developing', 'active', 'archived'].includes(status)) {
      filter.status = status;
    }
    const edges = await Edge.find(filter).sort({ createdAt: -1 }).lean();
    res.json(edges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch edges' });
  }
});

router.post('/edges', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId: string;
      title: string;
      description?: string;
      category?: string;
      linkedHandIds?: string[];
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const linkedHandIds = Array.isArray(body.linkedHandIds)
      ? body.linkedHandIds.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
      : [];
    const edge = new Edge({
      userId,
      title: (body.title ?? '').trim() || 'Untitled edge',
      description: (body.description ?? '').trim(),
      category: body.category ?? 'other',
      status: 'developing',
      linkedHandIds,
    });
    await edge.save();
    res.status(201).json(edge);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create edge' });
  }
});

router.patch('/edges/:id', async (req: Request, res: Response) => {
  try {
    const edge = await Edge.findById(req.params.id);
    if (!edge) return res.status(404).json({ error: 'Edge not found' });
    const body = req.body as {
      title?: string;
      description?: string;
      category?: string;
      status?: 'developing' | 'active' | 'archived';
      linkedHandIds?: string[];
      notes?: { _id?: string; content: string; createdAt?: Date }[];
    };
    if (body.title !== undefined) edge.title = body.title.trim() || 'Untitled edge';
    if (body.description !== undefined) edge.description = body.description.trim();
    if (body.category !== undefined) edge.category = body.category as string;
    if (
      body.status !== undefined &&
      ['developing', 'active', 'archived'].includes(body.status)
    ) {
      edge.status = body.status;
    }
    if (Array.isArray(body.linkedHandIds)) {
      edge.linkedHandIds = body.linkedHandIds.filter(
        (id): id is string => typeof id === 'string' && id.trim() !== ''
      );
    }
    if (Array.isArray(body.notes)) {
      edge.notes = body.notes.map((n) => ({
        _id: n._id ?? new mongoose.Types.ObjectId(),
        content: (n.content ?? '').trim(),
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
      }));
    }
    await edge.save();
    res.json(edge);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update edge' });
  }
});

router.delete('/edges/:id', async (req: Request, res: Response) => {
  try {
    const edge = await Edge.findByIdAndDelete(req.params.id);
    if (!edge) return res.status(404).json({ error: 'Edge not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete edge' });
  }
});

// ─── Mental Game ───────────────────────────────────────────────────────────
router.get('/mental', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const entries = await MentalGameEntry.find({ userId })
      .sort({ sessionDate: -1 })
      .lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mental game entries' });
  }
});

router.post('/mental', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId: string;
      sessionDate: string;
      stateRating: number;
      observation?: string;
      tiltAffected?: boolean;
      fatigueAffected?: boolean;
      confidenceAffected?: boolean;
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const stateRating = typeof body.stateRating === 'number' ? body.stateRating : 3;
    if (stateRating < 1 || stateRating > 5) {
      return res.status(400).json({ error: 'stateRating must be 1-5' });
    }
    const entry = new MentalGameEntry({
      userId,
      sessionDate: body.sessionDate ? new Date(body.sessionDate) : new Date(),
      stateRating,
      observation: (body.observation ?? '').trim().slice(0, 280),
      tiltAffected: body.tiltAffected === true,
      fatigueAffected: body.fatigueAffected === true,
      confidenceAffected: body.confidenceAffected === true,
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create mental game entry' });
  }
});

router.delete('/mental/:id', async (req: Request, res: Response) => {
  try {
    const entry = await MentalGameEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Mental game entry not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mental game entry' });
  }
});

// ─── Due for Review (spaced repetition) ─────────────────────────────────────
router.get('/due', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const now = new Date();
    const leaks = await Leak.find({
      userId,
      status: 'resolved',
      nextReviewAt: { $lte: now, $ne: null },
    })
      .sort({ nextReviewAt: 1 })
      .lean();
    res.json(leaks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch due leaks' });
  }
});

export default router;
