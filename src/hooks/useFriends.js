import { useState, useCallback } from 'react';
import { useApi } from './useApi';

export function useFriends() {
  const apiFetch = useApi();
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/friends');
      setFriends(data.friends || []);
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const sendRequest = useCallback(async (username) => {
    await apiFetch('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    await load();
  }, [apiFetch, load]);

  const accept = useCallback(async (friendshipId) => {
    await apiFetch(`/friends/${friendshipId}/accept`, { method: 'PUT' });
    await load();
  }, [apiFetch, load]);

  const remove = useCallback(async (friendshipId) => {
    await apiFetch(`/friends/${friendshipId}`, { method: 'DELETE' });
    await load();
  }, [apiFetch, load]);

  return { friends, incoming, outgoing, loading, error, load, sendRequest, accept, remove };
}
