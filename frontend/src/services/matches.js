/* Placeholder for /matches and /match-performance (Phase 6+). */
import { MATCHES } from '../data/mockData.js';

export async function listMatches() {
  return MATCHES;
}

export async function saveMatchPerformance(_payload) {
  throw new Error('Match Performance persistence arrives with FastAPI + MySQL (Phase 6+). This is a UI-only form in Phase 2.');
}
