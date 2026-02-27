import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { ClaimedUser } from '../models/ClaimedUser.js';
import { requireClaimedAuth, verifyClaimedUser, isNameClaimed } from '../utils/claimedAuth.js';

const router = Router();
const SALT_ROUNDS = 10;

/** POST /api/me/claim — claim a name with a password (name not already claimed) */
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body as { name?: string; password?: string };
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({ error: 'Password is required to claim a name.' });
    }
    const existing = await ClaimedUser.findOne({ name: trimmedName }).collation({ locale: 'en', strength: 2 });
    if (existing) {
      return res.status(409).json({ error: 'This name is already taken. Use Login if it is yours.' });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await new ClaimedUser({
      name: trimmedName,
      passwordHash,
      improvementNotes: '',
    }).save();
    res.status(201).json({ name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim name.' });
  }
});

/** POST /api/me/login — verify name + password (for use on another device) */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body as { name?: string; password?: string };
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName || typeof password !== 'string') {
      return res.status(400).json({ error: 'Name and password are required.' });
    }
    const user = await verifyClaimedUser(trimmedName, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid name or password.' });
    }
    res.json({ name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

/** GET /api/me/claimed — check if a name is claimed (no auth). Query: name= */
router.get('/claimed', async (req: Request, res: Response) => {
  try {
    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!name) {
      return res.status(400).json({ error: 'Query parameter "name" is required.' });
    }
    const claimed = await isNameClaimed(name);
    res.json({ claimed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check name.' });
  }
});

/** GET /api/me/improvement-notes — get improvement notes (requires Basic auth) */
router.get('/improvement-notes', requireClaimedAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { claimedUser: InstanceType<typeof ClaimedUser> }).claimedUser;
    res.json({ content: user.improvementNotes ?? '' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notes.' });
  }
});

/** PUT /api/me/improvement-notes — save improvement notes (requires Basic auth). Body: { content } */
router.put('/improvement-notes', requireClaimedAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { claimedUser: InstanceType<typeof ClaimedUser> }).claimedUser;
    const content = typeof req.body?.content === 'string' ? req.body.content : '';
    user.improvementNotes = content;
    await user.save();
    res.json({ content: user.improvementNotes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save notes.' });
  }
});

export default router;
