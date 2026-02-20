import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import * as Leaderboard from '../models/leaderboard.model.js';

const router = Router();

function metricValidator() {
  return query('metric')
    .optional()
    .custom((v) => {
      if (!Leaderboard.isValidMetric(v)) throw new Error('Invalid metric');
      return true;
    });
}

// GET /api/leaderboard/global?metric=total_visits&limit=50
router.get(
  '/global',
  verifyToken,
  metricValidator(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  async (req, res, next) => {
    try {
      const metric = req.query.metric || 'total_visits';
      const limit = req.query.limit || 50;
      const rows = await Leaderboard.getGlobal(metric, limit);
      res.json({ rows, metric });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/leaderboard/friends?metric=total_visits
router.get(
  '/friends',
  verifyToken,
  metricValidator(),
  validate,
  async (req, res, next) => {
    try {
      const metric = req.query.metric || 'total_visits';
      const rows = await Leaderboard.getFriends(req.user.id, metric);
      res.json({ rows, metric });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
