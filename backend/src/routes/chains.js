import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as Chain from '../models/chain.model.js';
import * as Visit from '../models/visit.model.js';

const router = Router();

// GET /api/chains — all chains with user's visited count
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const chains = await Chain.findAll(req.user.id);
    res.json({ chains });
  } catch (err) {
    next(err);
  }
});

// GET /api/chains/:slug — chain + locations with visited boolean
router.get('/:slug', verifyToken, async (req, res, next) => {
  try {
    const chain = await Chain.findBySlug(req.params.slug, req.user.id);
    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' });
    }
    res.json({ chain });
  } catch (err) {
    next(err);
  }
});

// GET /api/chains/:slug/stats — alias for dashboard usage
router.get('/:slug/stats', verifyToken, async (req, res, next) => {
  try {
    const stats = await Visit.getStats(req.user.id);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

export default router;
