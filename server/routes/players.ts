import { Router, Request, Response } from 'express';
import { Player } from '../models/Player.js';

const router = Router();

// GET /api/players — return all players
router.get('/', async (_req: Request, res: Response) => {
  try {
    const players = await Player.find().sort({ username: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET /api/players/:id — return single player
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// POST /api/players/import — bulk import (must be before /:id)
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { players: imported } = req.body as { players: Array<{
      username: string;
      playerType?: string;
      stakesSeenAt?: number[];
      notes: string;
    }> };

    if (!Array.isArray(imported) || imported.length === 0) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const results = { created: 0, updated: 0 };

    for (const p of imported) {
      const existing = await Player.findOne({ username: p.username });
      if (existing) {
        const mergedNotes = [existing.notes, p.notes].filter(Boolean).join('\n\n');
        await Player.findByIdAndUpdate(existing._id, {
          notes: mergedNotes,
          ...(p.playerType && { playerType: p.playerType }),
          ...(p.stakesSeenAt?.length && {
            stakesSeenAt: [...new Set([...(existing.stakesSeenAt || []), ...p.stakesSeenAt])],
          }),
        });
        results.updated++;
      } else {
        await new Player({
          username: p.username,
          playerType: p.playerType || 'Unknown',
          stakesSeenAt: p.stakesSeenAt || [],
          notes: p.notes || '',
        }).save();
        results.created++;
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Import failed' });
  }
});

// POST /api/players — create player
router.post('/', async (req: Request, res: Response) => {
  try {
    const player = new Player(req.body);
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create player' });
  }
});

// PUT /api/players/:id — update player
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update player' });
  }
});

// DELETE /api/players/:id — delete player
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;
