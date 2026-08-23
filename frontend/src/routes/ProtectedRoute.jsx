import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/*
 * PHASE 2 PLACEHOLDER — not real access control.
 * ------------------------------------------------------------------
 * This only checks the demo session set by the Login page's portal
 * buttons, so a visitor can't land on /admin/* by typing the URL
 * without having "signed in" as a demo role first. It performs no
 * password check and enforces nothing on a server, because there is
 * no server yet.
 *
 * Real RBAC (Phase 5) replaces this check with a verified JWT role
 * claim, and the backend re-checks every request regardless of what
 * the frontend route allows — the frontend guard is a convenience,
 * never the actual security boundary.
 * ------------------------------------------------------------------
 */
export default function ProtectedRoute({ role, children }) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (role && session.role !== role) return <Navigate to={`/${session.role}`} replace />;

  return children;
}
