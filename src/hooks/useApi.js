import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function useApi() {
  const { getAccessToken, logout } = useAuth();

  const apiFetch = useCallback(
    async (path, options = {}) => {
      let token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };

      let res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      // If 401, try refreshing token once
      if (res.status === 401) {
        token = await getAccessToken();
        if (!token) {
          logout();
          throw new Error('Session expired');
        }
        headers.Authorization = `Bearer ${token}`;
        res = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }

      return res.json();
    },
    [getAccessToken, logout]
  );

  return apiFetch;
}
