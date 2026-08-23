/* Placeholder for /training-sessions and /training-records (Phase 6+). */
import { TRAINING_SESSIONS, TRAINING_RECORDS_P001 } from '../data/mockData.js';

export async function listTrainingSessions() {
  return TRAINING_SESSIONS;
}

export async function listTrainingRecords(_playerId) {
  return TRAINING_RECORDS_P001;
}

export async function saveTrainingRecord(_payload) {
  throw new Error('Training Record persistence arrives with FastAPI + MySQL (Phase 6+). This is a UI-only form in Phase 2.');
}
