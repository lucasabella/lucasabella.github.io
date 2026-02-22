import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { getCurrentPositionAsync } from '../utils/geo';

export function useCheckins(initialLocations = []) {
    const apiFetch = useApi();
    const [checkinCounts, setCheckinCounts] = useState(() => {
        const counts = new Map();
        for (const loc of initialLocations) {
            if (loc.checkin_count !== undefined) {
                counts.set(loc.id, loc.checkin_count);
            }
        }
        return counts;
    });

    const [checkinError, setCheckinError] = useState(null);

    const updateFromLocations = useCallback((locations) => {
        const counts = new Map();
        for (const loc of locations) {
            if (loc.checkin_count !== undefined) {
                counts.set(loc.id, loc.checkin_count);
            }
        }
        setCheckinCounts(counts);
    }, []);

    const getCheckinCount = useCallback((id) => {
        return checkinCounts.get(id) || 0;
    }, [checkinCounts]);

    const checkIn = useCallback(async (locationId) => {
        setCheckinError(null);
        let coords = null;

        try {
            coords = await getCurrentPositionAsync();
        } catch (err) {
            setCheckinError(err.message);
            return null;
        }

        // Optimistic update
        setCheckinCounts((prev) => {
            const next = new Map(prev);
            const current = next.get(locationId) || 0;
            next.set(locationId, current + 1);
            return next;
        });

        try {
            const res = await apiFetch(`/checkins/${locationId}`, {
                method: 'POST',
                body: JSON.stringify({ lat: coords.lat, lng: coords.lng })
            });

            // Sync count from server response if valid
            if (res && res.checkinCount !== undefined) {
                setCheckinCounts(prev => {
                    const next = new Map(prev);
                    next.set(locationId, res.checkinCount);
                    return next;
                });
            }

            return res;
        } catch (err) {
            setCheckinError(err.message);
            // Revert optimistic update
            setCheckinCounts((prev) => {
                const next = new Map(prev);
                const current = next.get(locationId) || 1;
                next.set(locationId, Math.max(0, current - 1));
                return next;
            });
            return null;
        }
    }, [apiFetch]);

    return {
        checkinCounts,
        getCheckinCount,
        checkIn,
        updateFromLocations,
        checkinError,
        setCheckinError
    };
}
