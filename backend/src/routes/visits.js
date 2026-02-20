import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as Visit from '../models/visit.model.js';
import * as BadgeService from '../services/badge.service.js';

const router = Router();

// Static routes first (before :locationId param)

// GET /api/visits/stats — dashboard stats
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const stats = await Visit.getStats(req.user.id);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

// POST /api/visits/bulk — bulk mark by source IDs (for localStorage migration)
router.post(
  '/bulk',
  verifyToken,
  body('sourceIds').isArray({ min: 1 }),
  validate,
  async (req, res, next) => {
    try {
      const count = await Visit.bulkCreateBySourceIds(req.user.id, req.body.sourceIds);
      const newBadges = await BadgeService.checkAndAwardBadges(req.user.id);
      res.status(201).json({ migrated: count, newBadges });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/visits/:locationId — mark visited
router.post('/:locationId', verifyToken, async (req, res, next) => {
  try {
    const visit = await Visit.create(req.user.id, req.params.locationId);
    let newBadges = [];
    if (visit) {
      newBadges = await BadgeService.checkAndAwardBadges(req.user.id);
    }
    res.status(201).json({ visit, newBadges, message: 'Marked as visited' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Location not found' });
    }
    next(err);
  }
});

// DELETE /api/visits/:locationId — unmark visited
router.delete('/:locationId', verifyToken, async (req, res, next) => {
  try {
    const deleted = await Visit.remove(req.user.id, req.params.locationId);
    if (!deleted) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    const revokedBadges = await BadgeService.checkAndRevokeBadges(req.user.id);
    res.json({ message: 'Unmarked', revokedBadges });
  } catch (err) {
    next(err);
  }
});

export default router;
