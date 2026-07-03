import { useState, useEffect, useCallback } from 'react';
import { fireVisitConfetti } from '../utils/confetti';

const STORAGE_KEY = 'chainchaser-visits';
const LEGACY_KEY = 'chaincaser-visited';

function loadVisits() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function useVisits() {
  const [visitedIds, setVisitedIds] = useState(loadVisits);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visitedIds]));
  }, [visitedIds]);

  const toggleVisit = useCallback((locationId, e) => {
    if (e && !visitedIds.has(locationId)) fireVisitConfetti(e);
    setVisitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  }, [visitedIds]);

  const isVisited = useCallback((id) => visitedIds.has(id), [visitedIds]);

  return { visitedIds, isVisited, toggleVisit };
}
