/*
 * Phase 2 placeholder. This will become the shared HTTP client (axios or
 * fetch wrapper) once FastAPI exists (Phase 4+): base URL, auth header
 * injection, and error normalisation will live here.
 *
 * For now it exports nothing that talks to a network — every service
 * module below returns local demo data instead, clearly marked as such.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function notImplemented(name) {
  // Placeholder used by service functions until Phase 5+ backend integration.
  return Promise.reject(new Error(`${name} is not implemented yet — backend arrives in a later phase.`));
}
