import { Router, Request, Response } from 'express';
import { Withdrawal } from '../models/Withdrawal.js';

const router = Router();

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  const body = req.body as { userId?: string };
  return typeof body.userId === 'string' ? body.userId.trim() : undefined;
}

function parseDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// GET /api/withdrawals?userId=...
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const withdrawals = await Withdrawal.find({ userId })
      .sort({ date: -1 })
      .lean();
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// POST /api/withdrawals
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId?: string;
      date?: string;
      amount?: number | string;
      notes?: string | null;
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const dateVal = body.date ? parseDate(body.date) : new Date();
    if (!dateVal) return res.status(400).json({ error: 'Invalid date' });

    const amount = body.amount != null ? Number(body.amount) : null;
    if (amount == null || Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ error: 'Valid amount (≥ 0) required' });
    }

    const withdrawal = new Withdrawal({
      userId,
      date: dateVal,
      amount,
      notes: body.notes?.trim() || null,
    });
    await withdrawal.save();
    res.status(201).json(withdrawal);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create withdrawal';
    res.status(400).json({ error: message });
  }
});

// PATCH /api/withdrawals/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    const body = req.body as {
      date?: string;
      amount?: number | string;
      notes?: string | null;
    };
    if (body.date !== undefined) {
      const d = parseDate(body.date);
      if (d) withdrawal.date = d;
    }
    if (body.amount !== undefined) {
      const n = Number(body.amount);
      if (!Number.isNaN(n) && n >= 0) withdrawal.amount = n;
    }
    if (body.notes !== undefined) withdrawal.notes = body.notes?.trim() || null;
    await withdrawal.save();
    res.json(withdrawal);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update withdrawal';
    res.status(400).json({ error: message });
  }
});

// DELETE /api/withdrawals/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndDelete(req.params.id);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete withdrawal' });
  }
});

export default router;
