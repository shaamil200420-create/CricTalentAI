import { createContext, useContext, useState } from 'react';
import { DEMO_IDENTITIES } from '../data/mockData.js';
import { logout as clearAuthToken } from '../services/auth.js';

/*
 * loginAsDemo/logout below are still the Phase 2 demo-only session used
 * by the Login page's three "preview a portal" buttons — no password
 * check, no token, unchanged.
 *
 * loginWithToken() is the real counterpart: it's called after a
 * successful POST /api/auth/login (see services/auth.js + Login.jsx)
 * and stores the same `session` shape so ProtectedRoute/sidebars don't
 * need to know which path was used. The JWT itself lives in
 * sessionStorage via services/api.js's token helpers, not here.
 * ------------------------------------------------------------------
 */
const ROLE_TITLES = {
  admin: 'System Administrator',
  coach: 'Senior Performance Coach',
  player: 'Player',
};
const AuthContext = createContext(null);
const STORAGE_KEY = 'crictalentai-demo-session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const loginAsDemo = (role) => {
    const identity =
      role === 'coach' ? DEMO_IDENTITIES.coach
      : role === 'player' ? DEMO_IDENTITIES.player
      : DEMO_IDENTITIES.admin;
    const next = { role, identity, demo: true };
    setSession(next);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const loginWithToken = (user) => {
    // user = { role: 'ADMIN'|'COACH'|'PLAYER', id, name, username } from POST /api/auth/login
    const role = user.role.toLowerCase();
    const identity = {
      name: user.name,
      role: user.role.charAt(0) + user.role.slice(1).toLowerCase(),
      title: ROLE_TITLES[role] || '',
      username: user.username,
      id: user.id,
    };
    const next = { role, identity, demo: false };
    setSession(next);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const logout = () => {
    setSession(null);
    clearAuthToken();
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ session, loginAsDemo, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
