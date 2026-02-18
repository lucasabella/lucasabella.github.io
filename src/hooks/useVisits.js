import { useState, useCallback } from 'react';
import { useApi } from './useApi';

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
          await apiFetch(`/visits/${locationId}`, { method: 'POST' });
        }
      } catch {
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
