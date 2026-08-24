import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';

// Icons match the old Player Portal reference (player (4).html) 1:1 where a
// like-for-like Material Symbol exists — routes/labels/permissions are
// unchanged, this only affects which glyph renders next to each nav item.
const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: '/player', end: true, icon: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'My Records (view-only)',
    items: [
      { to: '/player/profile', icon: 'person', label: 'My Profile' },
      { to: '/player/matches', icon: 'bar_chart', label: 'My Match Stats' },
      { to: '/player/training', icon: 'fitness_center', label: 'My Training Records' },
      { to: '/player/schedule', icon: 'event_note', label: 'My Schedule' },
    ],
  },
  {
    label: 'Development',
    items: [
      { to: '/player/goals', icon: 'flag', label: 'My Goals' },
      { to: '/player/feedback', icon: 'forum', label: 'My Feedback' },
      { to: '/player/development-report', icon: 'description', label: 'My Development Report' },
      { to: '/player/training-progress', icon: 'monitoring', label: 'My Training Progress' },
    ],
  },
];

export default function PlayerLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const identity = session?.identity;

  return (
    <AppShell
      portalLabel="Player Portal"
      navGroups={NAV_GROUPS}
      identity={identity}
      onLogout={() => { logout(); navigate('/login'); }}
      headerTitle="Player Portal"
      headerSubtitle="Your progress, at a glance"
      variant="player"
      brandIcon="sports_cricket"
      statusPill="Season Active"
      headerRight={identity ? (
        <div className="top-header-identity">
          <div style={{ textAlign: 'right' }}>
            <div className="top-header-identity-name">{identity.name}</div>
            <div className="top-header-identity-role">{identity.title || identity.role}</div>
          </div>
          <div className="top-header-identity-avatar">{initials(identity.name)}</div>
        </div>
      ) : null}
    />
  );
}
