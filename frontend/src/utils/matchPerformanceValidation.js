/*
 * Client-side pre-validation for Match Entry / Match Records — mirrors the
 * exact same cricket rules the backend (routers/match_performance.py,
 * _recompute_and_validate()) enforces, so the Coach gets instant
 * field-level feedback before the request even reaches the server.
 *
 * The server is still the real source of truth: it re-validates and
 * recalculates everything itself rather than trusting this function's
 * result, so this file existing (or a bug in it) can never make SAVED
 * data incorrect — it only affects how fast the Coach sees an error.
 *
 * This replaces the old matchPerformanceStore.js, which held these same
 * rules alongside a browser-localStorage demo store. That store is gone —
 * Match Entry / Match Records / My Match Stats all now read and write
 * real MySQL through the /match-performance API — so only the pure
 * validation logic (nothing that touches localStorage) survives here.
 */
import { oversNotationToBalls, boundaryRunsValid } from './cricket.js';

// Fields that are only ever checked for "not negative" — no realistic
// upper bound of their own. Fours/Sixes stay here on purpose: they're
// bounded indirectly by the boundary-runs-vs-runs rule below, not by a
// standalone cap. Maidens/Dot Balls stay here too: their real ceiling is
// dynamic (tied to whatever Overs Bowled was actually entered), checked
// separately further down — a standalone cap here would just be wrong
// for a shorter bowling spell.
const NON_NEGATIVE_ONLY_FIELDS = ['fours', 'sixes', 'maidens', 'dotBalls'];

// Fields with a fixed realistic ceiling for one T20 innings (in addition
// to never being negative). Wickets keeps its own explicit check further
// down (unchanged, per the confirmed spec) rather than living here.
const RANGE_FIELDS = {
  runs: { max: 300, label: 'Runs' },
  ballsFaced: { max: 150, label: 'Balls faced' },
  runsConceded: { max: 150, label: 'Runs conceded' },
  wides: { max: 30, label: 'Wides' },
  noBalls: { max: 30, label: 'No-balls' },
  catches: { max: 10, label: 'Catches' },
  droppedCatches: { max: 15, label: 'Dropped catches' },
  runOuts: { max: 10, label: 'Run outs' },
  stumpings: { max: 10, label: 'Stumpings' },
  misfields: { max: 20, label: 'Misfields' },
};

/**
 * An over only has 6 legal balls (0-5) — "2.6", "3.7", "4.1" etc. are not
 * valid cricket overs notation even though oversNotationToBalls() clamps
 * them defensively rather than throwing. This is a form-validation rule
 * (not a calculation).
 */
export function isValidOversNotation(str) {
  if (str === '' || str === null || str === undefined) return true;
  const trimmed = String(str).trim();
  return /^\d+$/.test(trimmed) || /^\d+\.[0-5]$/.test(trimmed);
}

/**
 * Returns a {field: message} error map; an empty object means valid.
 * `playerRole` should be the REAL role from the database (the shared
 * Player Directory) — used only for the "stumpings requires a
 * Wicketkeeper-Batter" rule. There is no duplicate-record check here
 * anymore: the server enforces the one-record-per-player-per-match rule
 * and returns a clear error, shown via the existing Toast.
 */
export function validateMatchPerformance(form, { playerRole } = {}) {
  const errors = {};

  if (!form.playerId) errors.playerId = 'Select a player.';
  if (!form.matchId) errors.matchId = 'Select a match.';

  NON_NEGATIVE_ONLY_FIELDS.forEach((key) => {
    if (Number(form[key]) < 0) errors[key] = 'Must not be negative.';
  });

  Object.entries(RANGE_FIELDS).forEach(([key, { max, label }]) => {
    const value = Number(form[key]);
    if (value < 0 || value > max) {
      errors[key] = `${label} must be between 0 and ${max}.`;
    }
  });

  if (form.dismissalType !== 'Did Not Bat' && form.battingPosition !== '' && form.battingPosition !== null && form.battingPosition !== undefined) {
    const battingPosition = Number(form.battingPosition);
    if (battingPosition < 1 || battingPosition > 11) {
      errors.battingPosition = 'Batting position must be between 1 and 11.';
    }
  }

  if (!boundaryRunsValid(Number(form.runs) || 0, Number(form.fours) || 0, Number(form.sixes) || 0)) {
    errors.boundary = '4×fours + 6×sixes cannot exceed total runs entered.';
  }

  if (!isValidOversNotation(form.oversBowled)) {
    errors.oversBowled = 'Invalid cricket overs — the ball part must be 0–5 (an over has 6 legal balls).';
  } else {
    const legalBalls = oversNotationToBalls(form.oversBowled || '0.0');
    const maxLegalBalls = oversNotationToBalls('4.0'); // T20 academy bowling cap
    if (legalBalls > maxLegalBalls) {
      errors.oversBowled = 'Maximum T20 bowling allocation is 4.0 overs.';
    }
    if (Number(form.dotBalls) > legalBalls) {
      errors.dotBalls = 'Dot balls cannot exceed legal balls bowled.';
    }
    const completedOvers = Math.floor(legalBalls / 6);
    if (Number(form.maidens) > completedOvers) {
      errors.maidens = 'Maidens cannot exceed completed overs.';
    }
  }

  if (Number(form.wickets) > 10) {
    errors.wickets = 'Wickets cannot exceed 10.';
  }

  if (Number(form.stumpings) > 0 && playerRole && playerRole !== 'Wicketkeeper-Batter') {
    errors.stumpings = 'Only a Wicketkeeper-Batter can record stumpings.';
  }

  return errors;
}
