/*
 * Real authentication against the FastAPI backend: POST /api/auth/login
 * and GET /api/auth/me. context/AuthContext.jsx's demo-only session
 * (loginAsDemo/logout) is untouched and still works exactly as before —
 * this file backs the real username/password form on the Login page.
 */
import { apiRequest, setToken, clearToken } from './api.js';

export async function login(username, password) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: { username, password } });
  setToken(data.token);
  return data; // { token, role, id, name, username }
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

export function logout() {
  clearToken();
}
