import { Router, Request, Response } from 'express';
import { Reviewer } from '../models/Reviewer.js';

const router = Router();

// GET /api/reviewers — list all reviewer names (for tagging hands)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const reviewers = await Reviewer.find().sort({ name: 1 }).select('name').lean();
    res.json(reviewers.map((r) => r.name));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviewers' });
  }
});

// POST /api/reviewers — register current user (name in body); idempotent
router.post('/', async (req: Request, res: Response) => {
  try {
    const name = (req.body?.name as string)?.trim();
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const existing = await Reviewer.findOne({ name }).lean();
    if (existing) {
      return res.status(200).json({ name: existing.name });
    }
    const reviewer = new Reviewer({ name });
    await reviewer.save();
    res.status(201).json({ name: reviewer.name });
  } catch (err) {
    res.status(400).json({ error: 'Failed to register reviewer' });
  }
});

export default router;
