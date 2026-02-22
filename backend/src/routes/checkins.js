import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as CheckIn from '../models/checkin.model.js';
import * as Visit from '../models/visit.model.js';
import * as Location from '../models/location.model.js';
import * as BadgeService from '../services/badge.service.js';
import { haversineDistance } from '../utils/geo.js';
import config from '../config/env.js';

const router = Router();

// GET /api/checkins/my/:locationId — get check-in count for location
router.get('/my/:locationId', verifyToken, async (req, res, next) => {
    try {
        const count = await CheckIn.getCountForLocation(req.user.id, req.params.locationId);
        res.json({ count });
    } catch (err) {
        next(err);
    }
});

// POST /api/checkins/:locationId — check in
router.post(
    '/:locationId',
    verifyToken,
    body('lat').isNumeric().withMessage('lat must be a number'),
    body('lng').isNumeric().withMessage('lng must be a number'),
    validate,
    async (req, res, next) => {
        try {
            const { lat, lng } = req.body;
            const targetLocation = await Location.findById(req.params.locationId);

            if (!targetLocation) {
                return res.status(404).json({ error: 'Location not found' });
            }

            const distance = haversineDistance(lat, lng, targetLocation.lat, targetLocation.lng);
            const isAdmin = config.adminEmails.includes(req.user.email.toLowerCase());

            // 0.5 km = 500 meters
            if (!isAdmin && distance > 0.5) {
                return res.status(403).json({ error: 'You are too far away to check in here.' });
            }

            // 1. Create check-in (will throw 23505 if already checked in today)
            const checkIn = await CheckIn.create(req.user.id, req.params.locationId);

            // 2. Also ensure a visit exists (idempotent, won't error if already visited)
            const visit = await Visit.create(req.user.id, req.params.locationId);
            const isFirstVisit = !!visit;

            // 3. Award badges if first visit
            let newBadges = [];
            if (isFirstVisit) {
                newBadges = await BadgeService.checkAndAwardBadges(req.user.id);
            }

            // 4. Get updated count and mayor
            const checkinCount = await CheckIn.getCountForLocation(req.user.id, req.params.locationId);
            const mayorData = await CheckIn.getMayorForLocation(req.params.locationId);

            res.status(201).json({
                checkIn,
                isFirstVisit,
                newBadges,
                checkinCount,
                mayor: mayorData?.username || null,
                message: isFirstVisit ? 'Marked as visited and checked in' : 'Checked in successfully'
            });
        } catch (err) {
            if (err.code === '23505') {
                // Unique violation — already checked in today
                return res.status(409).json({ error: 'Already checked in today' });
            }
            if (err.code === '23503') {
                // Foreign key violation
                return res.status(404).json({ error: 'Location not found' });
            }
            next(err);
        }
    }
);

export default router;
