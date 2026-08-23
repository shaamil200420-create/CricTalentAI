import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: '/player', end: true, icon: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'My Records (view-only)',
    items: [
      { to: '/player/profile', icon: 'badge', label: 'My Profile' },
      { to: '/player/matches', icon: 'sports_cricket', label: 'My Match Stats' },
      { to: '/player/training', icon: 'fitness_center', label: 'My Training Records' },
      { to: '/player/schedule', icon: 'calendar_month', label: 'My Schedule' },
    ],
  },
  {
    label: 'Development',
    items: [
      { to: '/player/goals', icon: 'flag', label: 'My Goals' },
      { to: '/player/feedback', icon: 'forum', label: 'My Feedback' },
      { to: '/player/development-report', icon: 'description', label: 'My Development Report' },
      { to: '/player/training-progress', icon: 'trending_up', label: 'My Training Progress' },
    ],
  },
];

export default function PlayerLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell
      portalLabel="Player Portal"
      navGroups={NAV_GROUPS}
      identity={session?.identity}
      onLogout={() => { logout(); navigate('/login'); }}
      headerTitle="Player Portal"
      headerSubtitle="Your progress, at a glance"
    />
  );
}
