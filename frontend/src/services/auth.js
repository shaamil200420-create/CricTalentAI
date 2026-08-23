/*
 * Placeholder for real authentication (Phase 5): POST /auth/login,
 * GET /auth/me, JWT storage/refresh. Today the app uses
 * context/AuthContext.jsx's demo-only session instead of this file.
 */
export async function login(_username, _password) {
  throw new Error('Real login arrives in Phase 5 (JWT + bcrypt + RBAC). Use the demo portal buttons on the Login page for now.');
}

export async function getCurrentUser() {
  throw new Error('GET /auth/me arrives in Phase 5.');
}
