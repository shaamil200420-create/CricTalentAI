/*
 * Cricket calculation helpers, shared by Match Entry, Player stats,
 * Player Comparison and the trend charts.
 *
 * IMPORTANT: cricket overs are NOT decimal numbers. "3.5 overs" means
 * 3 complete overs + 5 legal balls, not 3.5 mathematically. Internally
 * we always work in legal balls and only format to X.Y overs for display.
 */

/** Strike rate = runs / balls faced * 100. Safe when ballsFaced is 0. */
export function strikeRate(runs, ballsFaced) {
  if (!ballsFaced || ballsFaced <= 0) return null;
  return (runs / ballsFaced) * 100;
}

/** Bowling economy = runs conceded / overs bowled, from LEGAL BALLS bowled. */
export function economyRate(runsConceded, legalBalls) {
  if (!legalBalls || legalBalls <= 0) return null;
  const overs = legalBalls / 6;
  return runsConceded / overs;
}

/** Converts legal balls (e.g. 23) into cricket overs notation (e.g. "3.5"). */
export function ballsToOversNotation(legalBalls) {
  if (legalBalls === null || legalBalls === undefined || Number.isNaN(legalBalls)) return '0.0';
  const completeOvers = Math.floor(legalBalls / 6);
  const remainder = legalBalls % 6;
  return `${completeOvers}.${remainder}`;
}

/** Converts overs notation text (e.g. "3.5") back into legal balls (23). */
export function oversNotationToBalls(oversText) {
  const str = String(oversText ?? '0.0');
  const [overPart, ballPart] = str.split('.');
  const overs = parseInt(overPart, 10) || 0;
  let balls = parseInt(ballPart, 10) || 0;
  if (balls > 5) balls = 5; // a 6th legal ball completes the next over
  return overs * 6 + balls;
}

/** Drill / attendance completion percentage, safe for a zero denominator. */
export function percentOf(part, whole) {
  if (!whole || whole <= 0) return null;
  return (part / whole) * 100;
}

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

/** 4*fours + 6*sixes must never exceed runs — used for Match Entry validation. */
export function boundaryRunsValid(runs, fours, sixes) {
  return 4 * (fours || 0) + 6 * (sixes || 0) <= (runs || 0);
}

/**
 * Fielding Score — derived automatically from raw fielding events
 * (Catches, Run Outs, Stumpings) so the Coach never types this value.
 *
 * This is NORMAL DERIVED SYSTEM LOGIC (a transparent prototype formula),
 * NOT a machine-learning model. It may later be reused as an input feature
 * for the Phase 4/5 analytical/ML components, and the weights below can be
 * revised if the final project methodology defines different ones.
 *
 * Fielding Score = (Catches × 8) + (Run Outs × 10) + (Stumpings × 10)
 */
export function fieldingScore(catches, runOuts, stumpings) {
  const c = Math.max(0, Number(catches) || 0);
  const r = Math.max(0, Number(runOuts) || 0);
  const s = Math.max(0, Number(stumpings) || 0);
  return c * 8 + r * 10 + s * 10;
}

export const PLAYER_ROLES = ['Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper-Batter'];
export const BATTING_STYLES = ['Right-hand bat', 'Left-hand bat'];
export const BOWLING_STYLES = [
  'Right-arm fast', 'Right-arm medium', 'Right-arm off-break', 'Right-arm leg-break',
  'Left-arm fast', 'Left-arm medium', 'Left-arm orthodox', 'Left-arm chinaman',
  'Does not bowl',
];
export const COACH_SPECIALIZATIONS = [
  'Batting', 'Bowling', 'Fielding', 'Wicketkeeping', 'Fitness & Conditioning',
  'Batting & Fielding', 'Bowling & Fielding', 'All-Round Coaching',
];
export const PRACTICE_SCORE_MAX = 100;
export const COACH_RATING_SCALE = [
  { value: 10, label: '10 — Outstanding' },
  { value: 9, label: '9 — Excellent' },
  { value: 8, label: '8 — Very Good' },
  { value: 7, label: '7 — Good' },
  { value: 6, label: '6 — Satisfactory' },
  { value: 5, label: '5 — Developing' },
  { value: 4, label: '4 — Below Target' },
  { value: 3, label: '3 — Needs Attention' },
  { value: 2, label: '2 — Poor' },
  { value: 1, label: '1 — Very Poor' },
];
