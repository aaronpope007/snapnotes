import { Router, Request, Response } from 'express';
import { GtoStudySession } from '../models/GtoStudySession.js';

/** Legacy read-only route for pre-refactor GtoStudySession documents. */
const router = Router();

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  return undefined;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const sessions = await GtoStudySession.find({ userId }).sort({ sessionDate: -1 }).lean();
    res.json(sessions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch legacy GTO study sessions' });
  }
});

export default router;
