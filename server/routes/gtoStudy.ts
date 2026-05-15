import { Router, Request, Response } from 'express';
import { GtoStudySession } from '../models/GtoStudySession.js';

const router = Router();

const HU_POSITIONS: string[] = ['SB', 'BB'];
const EIGHT_MAX_POSITIONS: string[] = ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

function getUserId(req: Request): string | undefined {
  const q = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  if (q) return q;
  const body = req.body as { userId?: string };
  return typeof body.userId === 'string' ? body.userId.trim() : undefined;
}

function parseSessionDate(value: unknown): Date | undefined {
  if (value == null || value === '') return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function validateSessionFields(body: {
  format?: string;
  stack?: string;
  handStart?: string;
  potType?: string;
  heroPosition?: string;
  villainPosition?: string;
  endsAfter?: string;
  evLoss?: number | null;
}): string | null {
  const format = body.format;
  const stack = body.stack;
  const handStart = body.handStart;
  const potType = body.potType;
  const heroPosition = body.heroPosition;
  const villainPosition = body.villainPosition;
  const endsAfter = body.endsAfter;

  if (format !== 'HU' && format !== '8max') return 'format must be HU or 8max';
  if (stack !== '100bb' && stack !== '200bb') return 'stack must be 100bb or 200bb';
  if (format === '8max' && stack !== '200bb') return '8max ring is 200bb only';
  if (handStart !== 'Preflop' && handStart !== 'Postflop') {
    return 'handStart must be Preflop or Postflop';
  }
  const potTypes = ['SRP', '3BP', '4BP', 'Folded To', 'Custom'];
  if (!potType || !potTypes.includes(potType)) return 'invalid potType';
  if (format === '8max' && handStart === 'Postflop' && potType === 'Folded To') {
    return 'Folded To is preflop-only for 8max';
  }
  const positions = format === 'HU' ? HU_POSITIONS : EIGHT_MAX_POSITIONS;
  if (!heroPosition || !positions.includes(heroPosition)) {
    return 'invalid heroPosition for format';
  }
  if (villainPosition != null && villainPosition !== '') {
    if (handStart !== 'Postflop') return 'villainPosition is postflop-only';
    if (!positions.includes(villainPosition)) {
      return 'invalid villainPosition for format';
    }
  }
  const endsOptions = ['FirstAction', 'StreetEnd', 'HandEnd'];
  if (!endsAfter || !endsOptions.includes(endsAfter)) return 'invalid endsAfter';
  if (body.evLoss != null && typeof body.evLoss === 'number' && !Number.isFinite(body.evLoss)) {
    return 'evLoss must be a finite number';
  }
  return null;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const sessions = await GtoStudySession.find({ userId }).sort({ sessionDate: -1 }).lean();
    res.json(sessions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch GTO study sessions' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      userId?: string;
      sessionDate?: string;
      format?: string;
      stack?: string;
      handStart?: string;
      potType?: string;
      heroPosition?: string;
      villainPosition?: string;
      endsAfter?: string;
      evLoss?: number;
      notes?: string;
    };
    const userId = body.userId?.trim() || getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const validationError = validateSessionFields(body);
    if (validationError) return res.status(400).json({ error: validationError });

    const sessionDate = parseSessionDate(body.sessionDate) ?? new Date();
    const evLoss =
      typeof body.evLoss === 'number' && Number.isFinite(body.evLoss) ? body.evLoss : undefined;

    const session = new GtoStudySession({
      userId,
      sessionDate,
      format: body.format,
      stack: body.stack,
      handStart: body.handStart,
      potType: body.potType,
      heroPosition: body.heroPosition,
      villainPosition:
        body.handStart === 'Postflop' && body.villainPosition?.trim()
          ? body.villainPosition.trim()
          : undefined,
      endsAfter: body.endsAfter,
      evLoss,
      notes: (body.notes ?? '').trim().slice(0, 500),
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create GTO study session';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const session = await GtoStudySession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'GTO study session not found' });

    const body = req.body as {
      sessionDate?: string;
      format?: string;
      stack?: string;
      handStart?: string;
      potType?: string;
      heroPosition?: string;
      villainPosition?: string | null;
      endsAfter?: string;
      evLoss?: number | null;
      notes?: string;
    };

    const mergedVillain =
      body.villainPosition !== undefined
        ? body.villainPosition === null
          ? undefined
          : body.villainPosition
        : session.villainPosition;

    const merged = {
      format: body.format ?? session.format,
      stack: body.stack ?? session.stack,
      handStart: body.handStart ?? session.handStart,
      potType: body.potType ?? session.potType,
      heroPosition: body.heroPosition ?? session.heroPosition,
      villainPosition: mergedVillain,
      endsAfter: body.endsAfter ?? session.endsAfter,
      evLoss: body.evLoss !== undefined ? body.evLoss : session.evLoss,
    };

    const validationError = validateSessionFields(merged);
    if (validationError) return res.status(400).json({ error: validationError });

    if (body.sessionDate !== undefined) {
      const d = parseSessionDate(body.sessionDate);
      if (!d) return res.status(400).json({ error: 'invalid sessionDate' });
      session.sessionDate = d;
    }
    session.format = merged.format as 'HU' | '8max';
    session.stack = merged.stack as '100bb' | '200bb';
    session.handStart = merged.handStart as 'Preflop' | 'Postflop';
    session.potType = merged.potType as 'SRP' | '3BP' | '4BP' | 'Folded To' | 'Custom';
    session.heroPosition = merged.heroPosition;
    session.endsAfter = merged.endsAfter as 'FirstAction' | 'StreetEnd' | 'HandEnd';

    if (merged.handStart === 'Postflop' && merged.villainPosition) {
      session.villainPosition = merged.villainPosition;
    } else {
      session.villainPosition = undefined;
    }

    if (body.evLoss !== undefined) {
      session.evLoss =
        body.evLoss == null || body.evLoss === ('' as unknown)
          ? undefined
          : typeof body.evLoss === 'number' && Number.isFinite(body.evLoss)
            ? body.evLoss
            : session.evLoss;
    }

    if (body.notes !== undefined) {
      session.notes = body.notes.trim().slice(0, 500);
    }

    await session.save();
    res.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update GTO study session';
    res.status(400).json({ error: message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const session = await GtoStudySession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'GTO study session not found' });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete GTO study session' });
  }
});

export default router;
