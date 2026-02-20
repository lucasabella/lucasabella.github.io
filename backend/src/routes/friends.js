import { Router } from 'express';
import { param, body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import * as Friendship from '../models/friendship.model.js';
import * as User from '../models/user.model.js';

const router = Router();

const requestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many friend requests, please try again later' },
});

// GET /api/friends — list all friendships for current user
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const rows = await Friendship.listForUser(req.user.id);
    const friends = rows.filter((r) => r.status === 'accepted');
    const incoming = rows.filter((r) => r.status === 'pending' && r.direction === 'incoming');
    const outgoing = rows.filter((r) => r.status === 'pending' && r.direction === 'outgoing');
    res.json({ friends, incoming, outgoing });
  } catch (err) {
    next(err);
  }
});

// POST /api/friends/request — send a friend request by username
router.post(
  '/request',
  verifyToken,
  requestLimiter,
  body('username').isString().notEmpty().withMessage('username is required'),
  validate,
  async (req, res, next) => {
    try {
      const target = await User.findByUsername(req.body.username);
      if (!target) {
        return res.status(404).json({ error: 'User not found' });
      }

      const friendship = await Friendship.sendRequest(req.user.id, target.id);
      res.status(201).json({ friendship });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      next(err);
    }
  }
);

// PUT /api/friends/:friendshipId/accept — accept a pending request
router.put(
  '/:friendshipId/accept',
  verifyToken,
  param('friendshipId').isUUID().withMessage('Invalid friendship ID'),
  validate,
  async (req, res, next) => {
    try {
      const friendship = await Friendship.acceptRequest(req.params.friendshipId, req.user.id);
      res.json({ friendship });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      next(err);
    }
  }
);

// DELETE /api/friends/:friendshipId — remove/decline/cancel a friendship
router.delete(
  '/:friendshipId',
  verifyToken,
  param('friendshipId').isUUID().withMessage('Invalid friendship ID'),
  validate,
  async (req, res, next) => {
    try {
      await Friendship.remove(req.params.friendshipId, req.user.id);
      res.json({ message: 'Friendship removed' });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      next(err);
    }
  }
);

export default router;
