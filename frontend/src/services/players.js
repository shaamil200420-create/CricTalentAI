/*
 * Placeholder service for /players, /players/{id}, /players/me/* (Phase 6+).
 * Returns Phase 2 demo data so pages/components already call a "service"
 * shaped the way real API integration will look later.
 */
import { PLAYERS, MATCH_PERFORMANCE_P001 } from '../data/mockData.js';

export async function listPlayers() {
  return PLAYERS;
}

export async function getPlayer(id) {
  return PLAYERS.find((p) => p.id === id) || null;
}

export async function getPlayerMatchHistory(_id) {
  // Demo only always returns the P001 shell regardless of id in Phase 2.
  return MATCH_PERFORMANCE_P001;
}
