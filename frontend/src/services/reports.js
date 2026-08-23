/* Placeholder for /reports (Phase 15 — real PDF/Excel generation). */
import { REPORTS } from '../data/mockData.js';

export async function listReports() {
  return REPORTS;
}

export async function generateReport(_payload) {
  throw new Error('Real PDF/Excel report generation arrives in Phase 15. This is a UI-only shell in Phase 2.');
}
