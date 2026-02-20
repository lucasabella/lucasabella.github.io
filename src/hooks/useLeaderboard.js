import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export function useLeaderboard(mode = 'global') {
  const apiFetch = useApi();
  const [rows, setRows] = useState([]);
  const [metric, setMetric] = useState('total_visits');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (currentMode, currentMetric) => {
    setLoading(true);
    setError(null);
    try {
      const path = currentMode === 'friends'
        ? `/leaderboard/friends?metric=${currentMetric}`
        : `/leaderboard/global?metric=${currentMetric}&limit=50`;
      const data = await apiFetch(path);
      setRows(data.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchData(mode, metric);
  }, [mode, metric, fetchData]);

  const changeMetric = useCallback((m) => {
    setMetric(m);
  }, []);

  return { rows, metric, loading, error, changeMetric };
}
