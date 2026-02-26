import { Router, Request, Response } from 'express';
import { HandToReview } from '../models/HandToReview.js';

const router = Router();

// GET /api/hands-to-review — list (optionally ?status=open|archived)
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const filter = status && (status === 'open' || status === 'archived') ? { status } : {};
    const hands = await HandToReview.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.json(hands);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hands to review' });
  }
});

// GET /api/hands-to-review/:id — single hand
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const hand = await HandToReview.findById(req.params.id).lean();
    if (!hand) return res.status(404).json({ error: 'Hand not found' });
    res.json(hand);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hand' });
  }
});

// POST /api/hands-to-review — create
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      title?: string;
      handText: string;
      createdBy: string;
    };
    if (!body.handText?.trim()) {
      return res.status(400).json({ error: 'Hand text is required' });
    }
    const hand = new HandToReview({
      title: body.title?.trim() || 'Untitled hand',
      handText: body.handText.trim(),
      createdBy: body.createdBy || 'Anonymous',
    });
    await hand.save();
    res.status(201).json(hand);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create hand' });
  }
});

// PUT /api/hands-to-review/:id — update (title, handText, status, add comment, rate)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      title?: string;
      handText?: string;
      status?: 'open' | 'archived';
      addComment?: { text: string; addedBy: string };
      deleteCommentIndex?: number;
      rateHand?: {
        starRating?: number;
        spicyRating?: number;
        userName: string;
      };
    };
    const hand = await HandToReview.findById(req.params.id);
    if (!hand) return res.status(404).json({ error: 'Hand not found' });

    const update: Record<string, unknown> = {};

    if (body.title !== undefined) update.title = body.title.trim() || 'Untitled hand';
    if (body.handText !== undefined) update.handText = body.handText.trim();

    if (body.status !== undefined && (body.status === 'open' || body.status === 'archived')) {
      update.status = body.status;
      if (body.status === 'archived') {
        update.archivedAt = new Date();
      } else {
        update.archivedAt = null;
      }
    }

    if (body.rateHand?.userName) {
      const { starRating, spicyRating, userName } = body.rateHand;
      const starRatings = [...(hand.starRatings || [])];
      const spicyRatings = [...(hand.spicyRatings || [])];

      if (typeof starRating === 'number' && starRating >= 0 && starRating <= 10) {
        const existing = starRatings.findIndex((r: { user: string }) => r.user === userName);
        const entry = { user: userName, rating: starRating };
        if (existing >= 0) starRatings[existing] = entry;
        else starRatings.push(entry);
        hand.starRatings = starRatings;
      }
      if (typeof spicyRating === 'number' && spicyRating >= 0 && spicyRating <= 5) {
        const existing = spicyRatings.findIndex((r: { user: string }) => r.user === userName);
        const entry = { user: userName, rating: spicyRating };
        if (existing >= 0) spicyRatings[existing] = entry;
        else spicyRatings.push(entry);
        hand.spicyRatings = spicyRatings;
      }
      await hand.save();
      return res.json(hand);
    }

    if (body.addComment?.text?.trim() && body.addComment.addedBy) {
      const comment = {
        text: body.addComment.text.trim(),
        addedBy: body.addComment.addedBy,
        addedAt: new Date(),
      };
      hand.comments.push(comment);
      await hand.save();
      return res.json(hand);
    }

    if (
      typeof body.deleteCommentIndex === 'number' &&
      body.deleteCommentIndex >= 0 &&
      body.deleteCommentIndex < (hand.comments?.length ?? 0)
    ) {
      hand.comments.splice(body.deleteCommentIndex, 1);
      await hand.save();
      return res.json(hand);
    }

    if (Object.keys(update).length > 0) {
      Object.assign(hand, update);
      await hand.save();
    }
    res.json(hand);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update hand' });
  }
});

// DELETE /api/hands-to-review/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const hand = await HandToReview.findByIdAndDelete(req.params.id);
    if (!hand) return res.status(404).json({ error: 'Hand not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hand' });
  }
});

export default router;
