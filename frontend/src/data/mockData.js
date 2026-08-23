/*
 * ============================================================
 * PHASE 2 DEMO / UI DATA ONLY — NOT A DATABASE, NOT ML DATA.
 * ============================================================
 * Everything in this file is temporary, frontend-only demo state used to
 * preserve and exercise the approved UI (cards, tables, forms, charts,
 * comparisons, AI interface shells) while no backend exists yet.
 *
 * This is LIVE-APPLICATION demo data — it represents what Users/Players/
 * Coaches/Matches etc. will look like once MySQL exists (Phase 3+). It is
 * a completely separate context from the HISTORICAL/SAMPLE ML dataset
 * (players.xlsx, match_performance.xlsx, and later training_records.xlsx),
 * which is never imported into this React app — see
 * docs/DATA_CONTEXTS.md for the full rule. An ID like "P001" here and
 * "P001" in the historical dataset are NOT the same person.
 *
 * None of this is persisted anywhere. It resets on every page reload and
 * gets replaced by real API calls (services/*.js) from Phase 5 onward.
 * ============================================================
 */

export const DEMO_IDENTITIES = {
  admin: { name: 'Admin User', role: 'Admin', title: 'System Administrator' },
  coach: { name: 'Ravi Jayasinghe', role: 'Coach', title: 'Senior Performance Coach' },
  player: { name: 'Kasun Perera', role: 'Player', title: 'Batter · U19 Academy', playerId: 'P001' },
};

export const PLAYERS = [
  { id: 'P001', name: 'Kasun Perera', age: 18, role: 'Batter', battingStyle: 'Right-hand bat', bowlingStyle: '—', heightCm: 174, weightKg: 66, status: 'Active', coach: 'Ravi Jayasinghe' },
  { id: 'P002', name: 'Nuwan Silva', age: 17, role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', heightCm: 179, weightKg: 70, status: 'Active', coach: 'Ravi Jayasinghe' },
  { id: 'P003', name: 'Dilan Fernando', age: 18, role: 'All-Rounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm off-break', heightCm: 171, weightKg: 64, status: 'Active', coach: 'Ravi Jayasinghe' },
  { id: 'P004', name: 'Sahan Wickramasinghe', age: 16, role: 'Wicketkeeper-Batter', battingStyle: 'Right-hand bat', bowlingStyle: '—', heightCm: 168, weightKg: 60, status: 'Active', coach: 'Ravi Jayasinghe' },
  { id: 'P005', name: 'Tharindu Bandara', age: 19, role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Left-arm medium', heightCm: 182, weightKg: 73, status: 'Active', coach: 'Ravi Jayasinghe' },
  { id: 'P006', name: 'Isuru Madushanka', age: 17, role: 'All-Rounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm leg-break', heightCm: 170, weightKg: 62, status: 'Inactive', coach: 'Ravi Jayasinghe' },
  { id: 'P007', name: 'Chamika Rathnayake', age: 18, role: 'Batter', battingStyle: 'Left-hand bat', bowlingStyle: '—', heightCm: 176, weightKg: 68, status: 'Active', coach: 'Ravi Jayasinghe' },
  { id: 'P008', name: 'Yohan Gunasekara', age: 16, role: 'Wicketkeeper-Batter', battingStyle: 'Right-hand bat', bowlingStyle: '—', heightCm: 165, weightKg: 58, status: 'Active', coach: 'Ravi Jayasinghe' },
];

export const COACHES = [
  { id: 'C001', name: 'Ravi Jayasinghe', username: 'ravi.j', phone: '+94 71 234 5678', specialization: 'Batting & Fielding', since: '2021-03-01', status: 'Active', assignedPlayers: PLAYERS.map((p) => p.id) },
];

export const USERS = [
  { id: 'U001', username: 'admin', name: 'Admin User', role: 'Admin', status: 'Active' },
  { id: 'U002', username: 'ravi.j', name: 'Ravi Jayasinghe', role: 'Coach', status: 'Active' },
  ...PLAYERS.map((p, i) => ({ id: `U${String(i + 3).padStart(3, '0')}`, username: p.name.split(' ')[0].toLowerCase() + '.' + p.id.toLowerCase(), name: p.name, role: 'Player', status: p.status })),
];

// `status`: 'Completed' matches have a recorded `result`; 'Scheduled' matches
// are fixtures added from Tournament Management awaiting a result (FR6 correction).
export const MATCHES = [
  { id: 'M001', date: '2026-07-05', opponent: 'Coastal Colts CC', venue: 'Central Academy Oval', tournament: 'Academy T20 Trophy', format: 'T20', status: 'Completed', result: 'Win' },
  { id: 'M002', date: '2026-07-12', opponent: 'Westport Eagles', venue: 'Sunset Sports Complex', tournament: 'Academy T20 Trophy', format: 'T20', status: 'Completed', result: 'Loss' },
  { id: 'M003', date: '2026-07-19', opponent: 'Silverline Hawks', venue: 'Hilltop Cricket Park', tournament: 'Academy T20 Trophy', format: 'T20', status: 'Completed', result: 'Win' },
  { id: 'M004', date: '2026-07-26', opponent: 'Harbor City Knights', venue: 'Riverside Stadium', tournament: null, format: 'T20', status: 'Completed', result: 'No Result' },
  { id: 'M005', date: '2026-08-02', opponent: 'Metro Falcons', venue: 'Central Academy Oval', tournament: 'Academy T20 Trophy', format: 'T20', status: 'Completed', result: 'Win' },
];

// Match_Performance shells — legal balls stored, not decimal overs. Used by
// My Match Stats, Player Comparison, Match history and trend charts.
// One shell per role archetype so role-aware UI (Player > My Match Stats,
// Coach > Player Comparison) has real data to render, not just P001.

// P001 — Kasun Perera (Batter): batting + fielding only, no bowling.
export const MATCH_PERFORMANCE_P001 = [
  { matchId: 'M001', runs: 42, ballsFaced: 31, fours: 5, sixes: 1, isOut: true, catches: 1, runOuts: 0 },
  { matchId: 'M002', runs: 18, ballsFaced: 20, fours: 2, sixes: 0, isOut: true, catches: 0, runOuts: 0 },
  { matchId: 'M003', runs: 61, ballsFaced: 39, fours: 7, sixes: 2, isOut: false, catches: 1, runOuts: 1 },
  { matchId: 'M004', runs: 9, ballsFaced: 14, fours: 1, sixes: 0, isOut: true, catches: 0, runOuts: 0 },
  { matchId: 'M005', runs: 55, ballsFaced: 34, fours: 6, sixes: 1, isOut: false, catches: 2, runOuts: 0 },
];

// P002 — Nuwan Silva (Bowler): bowling + fielding only, no batting.
// Wickets total (2+1+3+1+2=9) matches the Coach Dashboard's Top Performers entry.
export const MATCH_PERFORMANCE_P002 = [
  { matchId: 'M001', legalBalls: 24, runsConceded: 28, wickets: 2, maidens: 0, catches: 1, runOuts: 0 },
  { matchId: 'M002', legalBalls: 22, runsConceded: 32, wickets: 1, maidens: 0, catches: 0, runOuts: 0 },
  { matchId: 'M003', legalBalls: 24, runsConceded: 19, wickets: 3, maidens: 1, catches: 1, runOuts: 0 },
  { matchId: 'M004', legalBalls: 18, runsConceded: 22, wickets: 1, maidens: 0, catches: 0, runOuts: 1 },
  { matchId: 'M005', legalBalls: 24, runsConceded: 26, wickets: 2, maidens: 0, catches: 1, runOuts: 0 },
];

// P003 — Dilan Fernando (All-Rounder): batting AND bowling, plus fielding.
export const MATCH_PERFORMANCE_P003 = [
  { matchId: 'M001', runs: 24, ballsFaced: 19, fours: 2, sixes: 0, isOut: true, legalBalls: 18, runsConceded: 21, wickets: 1, maidens: 0, catches: 0, runOuts: 0 },
  { matchId: 'M002', runs: 11, ballsFaced: 10, fours: 1, sixes: 0, isOut: true, legalBalls: 12, runsConceded: 15, wickets: 0, maidens: 0, catches: 1, runOuts: 0 },
  { matchId: 'M003', runs: 38, ballsFaced: 27, fours: 4, sixes: 1, isOut: false, legalBalls: 24, runsConceded: 17, wickets: 2, maidens: 1, catches: 0, runOuts: 1 },
  { matchId: 'M004', runs: 6, ballsFaced: 9, fours: 0, sixes: 0, isOut: true, legalBalls: 6, runsConceded: 9, wickets: 0, maidens: 0, catches: 0, runOuts: 0 },
  { matchId: 'M005', runs: 29, ballsFaced: 22, fours: 3, sixes: 0, isOut: false, legalBalls: 18, runsConceded: 14, wickets: 1, maidens: 0, catches: 1, runOuts: 0 },
];

// P004 — Sahan Wickramasinghe (Wicketkeeper-Batter): batting + keeping/fielding, no bowling.
export const MATCH_PERFORMANCE_P004 = [
  { matchId: 'M001', runs: 15, ballsFaced: 16, fours: 1, sixes: 0, isOut: true, catches: 2, stumpings: 1 },
  { matchId: 'M002', runs: 33, ballsFaced: 28, fours: 3, sixes: 1, isOut: false, catches: 1, stumpings: 0 },
  { matchId: 'M003', runs: 8, ballsFaced: 11, fours: 1, sixes: 0, isOut: true, catches: 3, stumpings: 0 },
  { matchId: 'M004', runs: 21, ballsFaced: 17, fours: 2, sixes: 0, isOut: true, catches: 1, stumpings: 1 },
  { matchId: 'M005', runs: 40, ballsFaced: 30, fours: 4, sixes: 1, isOut: false, catches: 2, stumpings: 0 },
];

export const TRAINING_SESSIONS = [
  { id: 'TS001', name: 'Batting & Fielding Practice', type: 'Batting', date: '2026-08-18', time: '06:00', venue: 'Indoor Nets' },
  { id: 'TS002', name: 'Bowling Control Session', type: 'Bowling', date: '2026-08-20', time: '06:00', venue: 'Main Ground' },
  { id: 'TS003', name: 'Fitness & Conditioning', type: 'Fitness', date: '2026-08-22', time: '06:30', venue: 'Academy Gym' },
];

export const TRAINING_RECORDS_P001 = [
  { sessionId: 'TS001', attendance: 'Present', drillsAssigned: 5, drillsCompleted: 4, battingPractice: 82, bowlingPractice: null, fieldingScore: 74, fitnessScore: 78, coachRating: 8, coachNotes: 'Good tempo in the nets, work on strike rotation.' },
  { sessionId: 'TS002', attendance: 'Present', drillsAssigned: 6, drillsCompleted: 6, battingPractice: null, bowlingPractice: null, fieldingScore: 70, fitnessScore: 80, coachRating: 7, coachNotes: 'Solid fielding drills.' },
  { sessionId: 'TS003', attendance: 'Absent', drillsAssigned: 4, drillsCompleted: 0, battingPractice: null, bowlingPractice: null, fieldingScore: null, fitnessScore: null, coachRating: null, coachNotes: 'Unwell — excused.' },
];

export const TOURNAMENTS = [
  { id: 'T001', name: 'Academy T20 Trophy', format: 'T20', startDate: '2026-06-01', endDate: '2026-08-30', status: 'Ongoing', teams: 6, assignedPlayers: ['P001', 'P002', 'P003', 'P004', 'P005', 'P007', 'P008'] },
  { id: 'T002', name: 'U19 Inter-Academy T20 Cup', format: 'T20', startDate: '2026-09-10', endDate: '2026-09-24', status: 'Upcoming', teams: 8, assignedPlayers: [] },
];

export const GOALS_P001 = [
  { id: 'G001', focusArea: 'Strike Rate Improvement', target: 'Strike rate ≥ 135 across next 5 innings', deadline: '2026-09-15', progressPct: 60, status: 'In Progress' },
  { id: 'G002', focusArea: 'Fielding Reaction Time', target: 'Complete all fielding drills at 90%+ for 4 sessions', deadline: '2026-09-01', progressPct: 100, status: 'Achieved' },
];

export const DEVELOPMENT_PLANS_P001 = [
  { id: 'DP001', focusArea: 'Powerplay Batting', objective: 'Improve scoring rate in the first 6 overs without losing wickets early', startDate: '2026-07-01', targetDate: '2026-09-30', progressPct: 55, status: 'Active', notes: 'Reviewing shot selection against pace.' },
];

export const FEEDBACK_P001 = [
  { id: 'F001', date: '2026-08-10', text: 'Great composure chasing under pressure — kept strike rotation smart in the middle overs.', strengths: 'Composure, running between wickets', areasToImprove: 'Backing away against short-pitched bowling', visibility: 'PLAYER_VISIBLE' },
  { id: 'F002', date: '2026-08-15', text: 'Internal note: monitor workload — third net session this week showed early signs of fatigue.', strengths: '', areasToImprove: 'Recovery management', visibility: 'PRIVATE' },
];

// AI interface shells — demo/interface data ONLY. No model has run.
// Coach-facing; never shown to the Player portal directly (Section 26/H).
export const AI_PREDICTIONS_P001 = [
  {
    id: 'PR001',
    date: '2026-08-05',
    score: 78,
    potentialLevel: 'High',
    archetype: 'Batting All-Rounder (demo)',
    recommendation: { focus: 'Strike Rate Improvement', reason: 'Recent scoring rate trails the player’s own recent-form baseline.', priority: 'Medium' },
    modelVersion: 'demo-shell',
    reviewStatus: 'PENDING',
  },
  {
    id: 'PR002',
    date: '2026-07-20',
    score: 74,
    potentialLevel: 'High',
    archetype: 'Batting All-Rounder (demo)',
    recommendation: { focus: 'Fielding Reaction Time', reason: 'Demo placeholder reason — no model has run yet.', priority: 'Low' },
    modelVersion: 'demo-shell',
    reviewStatus: 'ACCEPTED',
  },
];

export const PERFORMANCE_ALERTS = [
  { id: 'AL001', player: 'Nuwan Silva', area: 'Bowling Economy', reason: 'Economy over the last 3 spells is noticeably worse than his recent baseline (demo placeholder).', severity: 'high', date: '2026-08-19' },
  { id: 'AL002', player: 'Dilan Fernando', area: 'Attendance', reason: 'Missed 2 of the last 4 training sessions (demo placeholder).', severity: 'medium', date: '2026-08-17' },
  { id: 'AL003', player: 'Chamika Rathnayake', area: 'Fitness Score', reason: 'Fitness score trending down over recent sessions (demo placeholder).', severity: 'low', date: '2026-08-14' },
];

export const REPORTS = [
  { id: 'RPT001', type: 'Player', subject: 'Kasun Perera', generatedBy: 'Ravi Jayasinghe', date: '2026-08-10', format: 'PDF', status: 'Ready' },
  { id: 'RPT002', type: 'Tournament', subject: 'Academy T20 Trophy', generatedBy: 'Admin User', date: '2026-08-03', format: 'Excel', status: 'Ready' },
  { id: 'RPT003', type: 'Development', subject: 'Kasun Perera', generatedBy: 'Ravi Jayasinghe', date: '2026-07-28', format: 'PDF', status: 'Ready' },
  { id: 'RPT004', type: 'Training', subject: 'Kasun Perera', generatedBy: 'Ravi Jayasinghe', date: '2026-08-19', format: 'Excel', status: 'Ready' },
  { id: 'RPT005', type: 'Performance', subject: 'Nuwan Silva', generatedBy: 'Ravi Jayasinghe', date: '2026-08-20', format: 'PDF', status: 'Ready' },
];

export const SCHEDULE_ITEMS = [
  { id: 'SC001', kind: 'Training', title: 'Batting & Fielding Practice', date: '2026-08-18', time: '06:00', venue: 'Indoor Nets' },
  { id: 'SC002', kind: 'Training', title: 'Bowling Control Session', date: '2026-08-20', time: '06:00', venue: 'Main Ground' },
  { id: 'SC003', kind: 'Match', title: 'vs Metro Falcons', date: '2026-08-23', time: '15:00', venue: 'Central Academy Oval' },
  { id: 'SC004', kind: 'Training', title: 'Fitness & Conditioning', date: '2026-08-22', time: '06:30', venue: 'Academy Gym' },
];

export const TOP_PERFORMERS = [
  { player: 'Kasun Perera', metric: 'Runs (last 5)', value: 185 },
  { player: 'Nuwan Silva', metric: 'Wickets (last 5)', value: 9 },
  { player: 'Chamika Rathnayake', metric: 'Strike Rate', value: 138.2 },
];
