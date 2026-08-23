import { createContext, useContext, useState } from 'react';
import { DEMO_IDENTITIES } from '../data/mockData.js';

/*
 * TEMPORARY, PHASE 2 ONLY.
 * ------------------------------------------------------------------
 * There is no backend yet, so there is no real authentication. This
 * context only remembers "which portal did the demo Login screen send
 * the visitor to" so the three portals can be previewed and the routes
 * are structured the way real RBAC will slot into during Phase 5.
 *
 * It performs NO password check, issues NO token, and must not be
 * mistaken for real security. Real JWT + bcrypt + RBAC replace this
 * entirely in Phase 5 (see services/auth.js).
 * ------------------------------------------------------------------
 */
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

  const logout = () => {
    setSession(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ session, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
