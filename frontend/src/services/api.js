/*
 * Shared HTTP client for the FastAPI backend. Every service module that
 * talks to the backend (auth.js, and the Admin pages once wired) goes
 * through apiRequest() here so the base URL, JWT header, and error
 * message handling only live in one place.
 *
 * Base URL comes from VITE_API_BASE_URL (see .env.example) so it is never
 * hard-coded inside individual components/pages.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const TOKEN_KEY = 'crictalentai-auth-token';

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch { /* ignore */ }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

/**
 * apiRequest('/admin/players', { method: 'POST', body: {...} })
 * Returns the parsed JSON body on success. Throws an Error whose message
 * is the backend's own detail string (e.g. "Username already exists.")
 * so callers can show it directly via the existing Toast system.
 */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try { data = JSON.parse(text); } catch { /* non-JSON response body */ }
  }

  if (!response.ok) {
    const detail = data?.detail;
    let message = 'Something went wrong. Please try again.';
    if (typeof detail === 'string') message = detail;
    else if (Array.isArray(detail) && detail[0]?.msg) message = detail[0].msg;
    throw new Error(message);
  }

  return data;
}

export function notImplemented(name) {
  // Still used by service modules for functionality outside this task's
  // scope (Coach/Player portal backends, AI/ML, etc.) — unrelated to
  // apiRequest() above.
  return Promise.reject(new Error(`${name} is not implemented yet — backend arrives in a later phase.`));
}
