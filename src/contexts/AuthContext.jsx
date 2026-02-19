import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const LOCALSTORAGE_KEY = 'chaincaser-visited';
const REFRESH_TOKEN_KEY = 'cc_refresh_token';
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
    // Try refreshing using stored refresh token
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
      });
      if (!res.ok) {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return null;
      }
      const data = await res.json();
      setAccessToken(data.accessToken);
      setUser(data.user);
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }
      return data.accessToken;
    } catch {
      return null;
    }
  }, [accessToken]);

  // On mount, try to restore session using stored refresh token
  useEffect(() => {
    (async () => {
      try {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
          if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
          }
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
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
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
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
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
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
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    migrateLocalStorage(data.accessToken);
    return data.user;
  };

  const logout = async () => {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
      });
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
