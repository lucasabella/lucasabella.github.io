import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { getCurrentPositionAsync } from '../utils/geo';

export function useVisits(initialLocations = []) {
  const apiFetch = useApi();
  const [visitedIds, setVisitedIds] = useState(() => {
    const set = new Set();
    for (const loc of initialLocations) {
      if (loc.visited) set.add(loc.id);
    }
    return set;
  });

  const updateFromLocations = useCallback((locations) => {
    const set = new Set();
    for (const loc of locations) {
      if (loc.visited) set.add(loc.id);
    }
    setVisitedIds(set);
  }, []);

  const toggleVisit = useCallback(
    async (locationId) => {
      const wasVisited = visitedIds.has(locationId);

      let coords = null;
      // We only need location if we are marking it AS visited (not unmarking)
      if (!wasVisited) {
        try {
          coords = await getCurrentPositionAsync();
        } catch (err) {
          window.alert(err.message);
          return;
        }
      }

      // Optimistic update
      setVisitedIds((prev) => {
        const next = new Set(prev);
        if (wasVisited) {
          next.delete(locationId);
        } else {
          next.add(locationId);
        }
        return next;
      });

      try {
        if (wasVisited) {
          await apiFetch(`/visits/${locationId}`, { method: 'DELETE' });
        } else {
          const res = await apiFetch(`/visits/${locationId}`, {
            method: 'POST',
            body: JSON.stringify({ lat: coords.lat, lng: coords.lng })
          });
          if (res && res.newBadges && res.newBadges.length > 0) {
            // Give a small delay so confetti from the button can finish
            setTimeout(() => {
              const badgeNames = res.newBadges.map(b => `${b.icon} ${b.name}`).join(', ');
              window.alert(`🎉 Achievement Unlocked: ${badgeNames}!\nCheck your Trophy Case on the Dashboard.`);
            }, 500);
          }
        }
      } catch (err) {
        if (err.message) {
          window.alert(err.message);
        }
        // Revert on failure
        setVisitedIds((prev) => {
          const next = new Set(prev);
          if (wasVisited) {
            next.add(locationId);
          } else {
            next.delete(locationId);
          }
          return next;
        });
      }
    },
    [visitedIds, apiFetch]
  );

  const isVisited = useCallback((id) => visitedIds.has(id), [visitedIds]);
  const visitedCount = visitedIds.size;

  return { visitedIds, visitedCount, isVisited, toggleVisit, updateFromLocations };
}
