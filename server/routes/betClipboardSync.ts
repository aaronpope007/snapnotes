import { Router } from 'express';
import { randomUUID } from 'crypto';
import { BetClipboardSync } from '../models/BetClipboardSync.js';

const router = Router();

const SYNC_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type BetClipboardSyncLean = {
  syncId: string;
  payload: unknown;
  updatedAt: Date;
};

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x != null && !Array.isArray(x);
}

router.post('/', async (_req, res) => {
  try {
    const syncId = randomUUID();
    const doc = await BetClipboardSync.create({
      syncId,
      payload: { version: 1 },
    });
    return res.status(201).json({
      syncId: doc.syncId,
      payload: doc.payload,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error('betClipboardSync POST', err);
    return res.status(500).json({ error: 'Could not create sync document.' });
  }
});

router.get('/:syncId', async (req, res) => {
  const { syncId } = req.params;
  if (!SYNC_ID_RE.test(syncId)) {
    return res.status(400).json({ error: 'Invalid sync id.' });
  }
  try {
    const doc = (await BetClipboardSync.findOne({ syncId }).lean()) as BetClipboardSyncLean | null;
    if (!doc) return res.status(404).json({ error: 'Not found.' });
    return res.json({
      syncId: doc.syncId,
      payload: doc.payload,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error('betClipboardSync GET', err);
    return res.status(500).json({ error: 'Could not load sync document.' });
  }
});

router.put('/:syncId', async (req, res) => {
  const { syncId } = req.params;
  if (!SYNC_ID_RE.test(syncId)) {
    return res.status(400).json({ error: 'Invalid sync id.' });
  }
  const body = req.body as unknown;
  if (!isPlainObject(body) || !('payload' in body)) {
    return res.status(400).json({ error: 'Expected { payload: object }.' });
  }
  const { payload } = body;
  if (!isPlainObject(payload)) {
    return res.status(400).json({ error: 'payload must be an object.' });
  }
  try {
    const doc = (await BetClipboardSync.findOneAndUpdate(
      { syncId },
      { $set: { payload, updatedAt: new Date() } },
      { new: true }
    ).lean()) as BetClipboardSyncLean | null;
    if (!doc) {
      return res.status(404).json({ error: 'Sync id not found. Generate a new id first.' });
    }
    return res.json({
      syncId: doc.syncId,
      payload: doc.payload,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error('betClipboardSync PUT', err);
    return res.status(500).json({ error: 'Could not save sync document.' });
  }
});

export default router;
