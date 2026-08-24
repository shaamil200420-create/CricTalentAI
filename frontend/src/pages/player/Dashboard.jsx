import PlayerOverview from './PlayerOverview.jsx';

// The "Dashboard" sidebar item / route. Renders the shared Player Overview
// page starting from the top (Welcome header first) — see PlayerOverview.jsx
// for the actual content. Kept as its own file/route so the Dashboard nav
// item and its active-state styling are unaffected by this merge.
export default function PlayerDashboard() {
  return <PlayerOverview />;
}
