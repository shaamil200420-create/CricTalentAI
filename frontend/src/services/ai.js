/*
 * Placeholder for the AI endpoints (Phase 14): /ai/predict/{id},
 * /ai/predictions/{id}, /ai/archetype/{id}, /ai/recommendations/{id},
 * /ai/alerts. No model exists yet — this never fabricates a "real" score.
 */
import { AI_PREDICTIONS_P001, PERFORMANCE_ALERTS } from '../data/mockData.js';

export async function getPredictionHistory(_playerId) {
  return AI_PREDICTIONS_P001;
}

export async function requestPrediction(_playerId) {
  throw new Error('Live prediction requires the trained model + AI service (later phases). This button is a UI shell in Phase 2.');
}

export async function getPerformanceAlerts() {
  return PERFORMANCE_ALERTS;
}
