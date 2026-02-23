import { Router, Request, Response } from 'express';
import { Player } from '../models/Player.js';

const router = Router();

// GET /api/players — return list (username, playerType, stakesSeenAt, _id only)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const players = await Player.find()
      .select('username playerType stakesSeenAt')
      .sort({ username: 1 })
      .collation({ locale: 'en', strength: 2 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// POST /api/players/import — bulk import (must be before /:id)
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { players: imported } = req.body as {
      players: Array<{
        username: string;
        playerType: string;
        stakesSeenAt: number[];
        stakeNotes: Array<{ stake: number | null; text: string }>;
        exploits: string[];
        rawNote: string;
      }>;
    };

    if (!Array.isArray(imported) || imported.length === 0) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const results = { created: 0, updated: 0 };

    for (const p of imported) {
      const existing = await Player.findOne({ username: p.username }).collation({
        locale: 'en',
        strength: 2,
      });

      if (existing) {
        const mergedStakeNotes = [...(existing.stakeNotes || [])];
        for (const sn of p.stakeNotes || []) {
          const idx = mergedStakeNotes.findIndex((m) => m.stake === sn.stake);
          if (idx >= 0) {
            mergedStakeNotes[idx].text = [mergedStakeNotes[idx].text, sn.text].filter(Boolean).join('\n');
          } else {
            mergedStakeNotes.push(sn);
          }
        }
        const mergedExploits = [...new Set([...(existing.exploits || []), ...(p.exploits || [])])];
        const mergedRaw = [existing.rawNote, p.rawNote].filter(Boolean).join('\n\n');
        const mergedStakes = [...new Set([...(existing.stakesSeenAt || []), ...(p.stakesSeenAt || [])])].sort((a, b) => a - b);

        await Player.findByIdAndUpdate(existing._id, {
          stakeNotes: mergedStakeNotes,
          exploits: mergedExploits,
          rawNote: mergedRaw,
          stakesSeenAt: mergedStakes,
        });
        results.updated++;
      } else {
        await new Player({
          username: p.username,
          playerType: p.playerType || 'unknown',
          stakesSeenAt: p.stakesSeenAt || [],
          stakeNotes: p.stakeNotes || [],
          exploits: p.exploits || [],
          rawNote: p.rawNote || '',
        }).save();
        results.created++;
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Import failed' });
  }
});

// GET /api/players/:id — return full single player
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player' });
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
