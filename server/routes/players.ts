import { Router, Request, Response } from 'express';
import { Player } from '../models/Player.js';

const router = Router();

interface LegacyStakeNote {
  stake?: number | null;
  text?: string;
}

function migrateLegacyNotes(doc: {
  stakeNotes?: LegacyStakeNote[];
  rawNote?: string;
  notes?: Array<{ text: string; addedBy: string; addedAt: Date | string; source?: string }>;
}): Array<{ text: string; addedBy: string; addedAt: string; source?: string }> {
  const notes = doc.notes;
  if (notes && notes.length > 0) return notes as Array<{ text: string; addedBy: string; addedAt: string; source?: string }>;

  const parts: string[] = [];
  const stakeNotes = (doc.stakeNotes || []) as LegacyStakeNote[];
  for (const sn of stakeNotes) {
    if (sn.text?.trim()) {
      const label = sn.stake != null ? `[${sn.stake}] ` : '';
      parts.push(label + sn.text.trim());
    }
  }
  const rawNote = doc.rawNote?.trim();
  if (rawNote) parts.push(rawNote);

  const combined = parts.join('\n\n');
  if (!combined) return [];

  return [
    {
      text: combined,
      addedBy: 'Legacy import',
      addedAt: new Date().toISOString(),
    },
  ];
}

function normalizeStakesAndFormats(doc: Record<string, unknown>): { stakesSeenAt: number[]; formats: string[] } {
  const sf = doc.stakesWithFormat;
  const stakes = doc.stakesSeenAt;
  const formats = doc.formats;

  if (Array.isArray(sf) && sf.length > 0 && sf.every((v) => typeof v === 'object' && v !== null && 'stake' in v)) {
    const stakesSeenAt = [...new Set((sf as { stake: number }[]).map((s) => s.stake))].sort((a, b) => a - b);
    const formatSet = new Set<string>();
    for (const s of sf as { format: string }[]) {
      formatSet.add(s.format === 'HU' ? 'Heads up' : 'Ring');
    }
    return { stakesSeenAt, formats: Array.from(formatSet) };
  }
  if (Array.isArray(stakes) && stakes.every((v) => typeof v === 'number')) {
    return {
      stakesSeenAt: (stakes as number[]).sort((a, b) => a - b),
      formats: Array.isArray(formats) ? (formats as string[]) : [],
    };
  }
  return { stakesSeenAt: [], formats: [] };
}

// GET /api/players — return list
router.get('/', async (_req: Request, res: Response) => {
  try {
    const players = await Player.find()
      .select('username playerType gameTypes stakesSeenAt stakesWithFormat formats origin')
      .sort({ username: 1 })
      .collation({ locale: 'en', strength: 2 })
      .lean();
    const normalized = (players as Record<string, unknown>[]).map((p) => {
      const { stakesSeenAt, formats } = normalizeStakesAndFormats(p);
      const origin = typeof p.origin === 'string' ? p.origin : 'WPT Gold';
      const gameTypes = Array.isArray(p.gameTypes) ? (p.gameTypes as string[]) : [];
      const { stakesWithFormat, ...rest } = p;
      void stakesWithFormat;
      return { ...rest, gameTypes, stakesSeenAt, formats, origin };
    });
    res.json(normalized);
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
        gameTypes?: string[];
        stakesSeenAt?: number[];
        formats?: string[];
        notes: Array<{ text: string; addedBy: string; addedAt: string; source?: string }>;
        exploits: string[];
        importedBy: string;
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

      const importNotes = (p.notes || []).map((n) => ({
        text: n.text,
        addedBy: n.addedBy,
        addedAt: n.addedAt ? new Date(n.addedAt) : new Date(),
        source: n.source || undefined,
      }));

      const importGameTypes = p.gameTypes || [];
      const importStakes = p.stakesSeenAt || [];
      const importFormats = p.formats || ['Ring'];

      if (existing) {
        const existingDoc = existing.toObject() as Record<string, unknown>;
        const migratedNotes = migrateLegacyNotes(existingDoc);
        const mergedNotes = [...migratedNotes, ...importNotes];
        const mergedExploits = [...new Set([...(existing.exploits || []), ...(p.exploits || [])])];
        const existingGameTypes = Array.isArray(existingDoc.gameTypes) ? (existingDoc.gameTypes as string[]) : [];
        const mergedGameTypes = [...new Set([...existingGameTypes, ...importGameTypes])];
        const { stakesSeenAt: existingStakes, formats: existingFormats } = normalizeStakesAndFormats(existingDoc);
        const mergedStakes = [...new Set([...existingStakes, ...importStakes])].sort((a, b) => a - b);
        const mergedFormats = [...new Set([...existingFormats, ...importFormats])];

        await Player.findByIdAndUpdate(existing._id, {
          notes: mergedNotes,
          exploits: mergedExploits,
          gameTypes: mergedGameTypes,
          stakesSeenAt: mergedStakes,
          formats: mergedFormats,
          $unset: { stakeNotes: 1, rawNote: 1, stakesWithFormat: 1 },
        });
        results.updated++;
      } else {
        await new Player({
          username: p.username,
          playerType: p.playerType || 'unknown',
          gameTypes: importGameTypes,
          stakesSeenAt: importStakes,
          formats: importFormats,
          notes: importNotes,
          exploits: p.exploits || [],
        }).save();
        results.created++;
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Import failed' });
  }
});

interface HandHistoryEntry {
  title: string;
  content: string;
}

function normalizeHandHistories(val: unknown): HandHistoryEntry[] {
  if (Array.isArray(val)) {
    const hasObjects = val.some(
      (v) => typeof v === 'object' && v !== null && 'title' in v && 'content' in v
    );
    if (hasObjects) {
      return val.map((v) => ({
        title: (v as HandHistoryEntry).title ?? '',
        content: (v as HandHistoryEntry).content ?? '',
      }));
    }
    if (val.every((v) => typeof v === 'string')) {
      return (val as string[]).map((s, i) => ({ title: `Hand ${i + 1}`, content: s }));
    }
  }
  if (typeof val === 'string' && val.trim()) {
    return [{ title: 'Hand 1', content: val.trim() }];
  }
  return [];
}

// GET /api/players/:id — return full single player (with migration for legacy stakeNotes/rawNote, handHistories)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const player = await Player.findById(req.params.id).lean();
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const obj = player as Record<string, unknown>;
    const notes = migrateLegacyNotes(obj);
    if (notes.length > 0 && (!obj.notes || (obj.notes as unknown[]).length === 0)) {
      await Player.findByIdAndUpdate(req.params.id, {
        notes,
        $unset: { stakeNotes: 1, rawNote: 1 },
      });
      obj.notes = notes;
    }
    const handHistories = normalizeHandHistories(obj.handHistories);
    const needsHandHistoriesMigration =
      !Array.isArray(obj.handHistories) ||
      (Array.isArray(obj.handHistories) &&
        obj.handHistories.length > 0 &&
        typeof obj.handHistories[0] === 'string');
    const { stakesSeenAt, formats } = normalizeStakesAndFormats(obj);
    const needsStakesMigration = obj.stakesWithFormat !== undefined;
    const origin = typeof obj.origin === 'string' ? obj.origin : 'WPT Gold';
    const gameTypes = Array.isArray(obj.gameTypes) ? (obj.gameTypes as string[]) : [];

    const update: Record<string, unknown> = { $set: {} };
    if (needsHandHistoriesMigration) (update.$set as Record<string, unknown>).handHistories = handHistories;
    if (needsStakesMigration) {
      (update.$set as Record<string, unknown>).stakesSeenAt = stakesSeenAt;
      (update.$set as Record<string, unknown>).formats = formats;
      update.$unset = { stakesWithFormat: 1 };
    }

    if (Object.keys((update.$set as object) || {}).length > 0 || update.$unset) {
      await Player.findByIdAndUpdate(req.params.id, update);
    }

    const out = obj as Record<string, unknown>;
    const { stakeNotes, rawNote, stakesWithFormat, ...rest } = out;
    void stakeNotes;
    void rawNote;
    void stakesWithFormat;
    res.json({ ...rest, handHistories, gameTypes, stakesSeenAt, formats, origin } as object);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// POST /api/players — create player
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (body.notes && Array.isArray(body.notes)) {
      body.notes = body.notes.map((n: { text: string; addedBy: string; addedAt: string }) => ({
        ...n,
        addedAt: n.addedAt ? new Date(n.addedAt) : new Date(),
      }));
    }
    const player = new Player(body);
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create player' });
  }
});

// PUT /api/players/:id — update player
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (body.notes && Array.isArray(body.notes)) {
      body.notes = body.notes.map((n: { text: string; addedBy: string; addedAt: string }) => ({
        ...n,
        addedAt: n.addedAt ? new Date(n.addedAt) : new Date(),
      }));
    }
    const update: Record<string, unknown> = { $set: body };
    if (body.notes) update.$unset = { stakeNotes: 1, rawNote: 1 };
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      update,
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
