import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import * as User from '../models/user.model.js';
import * as authService from '../services/auth.service.js';
import * as BadgeService from '../services/badge.service.js';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  body('username').optional().matches(/^[a-z0-9_]{3,30}$/).withMessage('Username must be 3–30 chars: lowercase letters, numbers, underscores'),
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, username: requestedUsername } = req.body;

      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const username = requestedUsername || authService.generateUsername(name);
      const passwordHash = await authService.hashPassword(password);

      let user;
      try {
        user = await User.create({ email, name, username, passwordHash });
      } catch (err) {
        if (err.code === '23505' && err.constraint === 'users_username_unique') {
          // Username collision — generate a fresh one
          const fallbackUsername = authService.generateUsername(name);
          user = await User.create({ email, name, username: fallbackUsername, passwordHash });
        } else {
          throw err;
        }
      }

      const safeUser = { id: user.id, email: user.email, name: user.name, username: user.username, avatar_url: user.avatar_url };
      const accessToken = authService.generateAccessToken(safeUser);
      const refreshToken = authService.generateRefreshToken();
      await authService.saveRefreshToken(user.id, refreshToken);
      authService.setRefreshCookie(res, refreshToken);

      res.status(201).json({ user: safeUser, accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await authService.comparePassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const safeUser = { id: user.id, email: user.email, name: user.name, username: user.username, avatar_url: user.avatar_url };
      const accessToken = authService.generateAccessToken(safeUser);
      const refreshToken = authService.generateRefreshToken();
      await authService.saveRefreshToken(user.id, refreshToken);
      authService.setRefreshCookie(res, refreshToken);

      res.json({ user: safeUser, accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/google
router.post(
  '/google',
  body('idToken').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { idToken } = req.body;
      const googleUser = await authService.verifyGoogleToken(idToken);

      let user = await User.findByGoogleId(googleUser.googleId);
      if (!user) {
        // Check if email exists (link accounts)
        user = await User.findByEmail(googleUser.email);
        if (user) {
          // Update with Google ID
          const pool = (await import('../config/db.js')).default;
          await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [
            googleUser.googleId,
            googleUser.avatarUrl,
            user.id,
          ]);
        } else {
          const username = authService.generateUsername(googleUser.name);
          user = await User.create({
            email: googleUser.email,
            name: googleUser.name,
            username,
            googleId: googleUser.googleId,
            avatarUrl: googleUser.avatarUrl,
          });
        }
      }

      const safeUser = { id: user.id, email: user.email || googleUser.email, name: user.name || googleUser.name, username: user.username, avatar_url: user.avatar_url || googleUser.avatarUrl };
      const accessToken = authService.generateAccessToken(safeUser);
      const refreshToken = authService.generateRefreshToken();
      await authService.saveRefreshToken(user.id, refreshToken);
      authService.setRefreshCookie(res, refreshToken);

      res.json({ user: safeUser, accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    // Accept token from httpOnly cookie (same-origin) or request body (cross-origin, e.g. GitHub Pages → Railway)
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const stored = await authService.findRefreshToken(token);
    if (!stored) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Rotate: delete old, issue new
    await authService.deleteRefreshToken(token);
    const newRefreshToken = authService.generateRefreshToken();
    await authService.saveRefreshToken(stored.user_id, newRefreshToken);
    authService.setRefreshCookie(res, newRefreshToken);

    const user = { id: stored.uid, email: stored.email, name: stored.name, username: stored.username, avatar_url: stored.avatar_url };
    const accessToken = authService.generateAccessToken(user);

    res.json({ user, accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', verifyToken, async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await authService.deleteRefreshToken(token);
    }
    authService.clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const badges = await BadgeService.getUserBadges(req.user.id);
    res.json({ user: { ...user, badges } });
  } catch (err) {
    next(err);
  }
});

export default router;
