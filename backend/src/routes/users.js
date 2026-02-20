import { Router } from 'express';
import { query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import * as User from '../models/user.model.js';

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many search requests, please try again later' },
});

// GET /api/users/search?q=
router.get(
  '/search',
  verifyToken,
  searchLimiter,
  query('q').isString().isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
  validate,
  async (req, res, next) => {
    try {
      const users = await User.searchByUsername(req.query.q, 20);
      res.json({ users });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
