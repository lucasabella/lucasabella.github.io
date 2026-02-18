import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const LOCALSTORAGE_KEY = 'chaincaser-visited';
const AuthContext = createContext(null);

async function migrateLocalStorage(token) {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return;
    const sourceIds = JSON.parse(raw);
    if (!Array.isArray(sourceIds) || sourceIds.length === 0) return;

    await fetch(`${API_URL}/visits/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ sourceIds }),
    });

    localStorage.removeItem(LOCALSTORAGE_KEY);
  } catch {
    // Non-critical — will retry next login
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAccessToken = useCallback(async () => {
    if (accessToken) return accessToken;
    // Try refreshing
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch {
      return null;
    }
  }, [accessToken]);

  // On mount, try to restore session from refresh token
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch {
        // No valid session
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    migrateLocalStorage(data.accessToken);
    return data.user;
  };

  const register = async (email, password, name) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || err.errors?.[0]?.msg || 'Registration failed');
    }
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    migrateLocalStorage(data.accessToken);
    return data.user;
  };

  const loginWithGoogle = async (idToken) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Google login failed');
    }
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    migrateLocalStorage(data.accessToken);
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
