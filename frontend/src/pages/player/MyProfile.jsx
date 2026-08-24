import PlayerOverview from './PlayerOverview.jsx';

// The "My Profile" sidebar item / route. Renders the SAME shared Player
// Overview page as Dashboard.jsx — there is only one implementation of the
// combined page (PlayerOverview.jsx) so the two can never drift apart — but
// scrolls straight to the Profile Details section on mount. Kept as its own
// file/route (rather than a redirect) purely so "My Profile" gets its own
// URL and its own active nav-item highlighting.
export default function MyProfile() {
  return <PlayerOverview focusProfile />;
}
