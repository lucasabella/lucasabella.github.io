import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'chaincaser-visited';

export default function useVisited() {
  const [visitedIds, setVisitedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visitedIds]));
  }, [visitedIds]);

  const toggleVisit = useCallback((id) => {
    setVisitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isVisited = useCallback((id) => visitedIds.has(id), [visitedIds]);

  return {
    visitedIds,
    toggleVisit,
    isVisited,
    visitedCount: visitedIds.size,
  };
}
