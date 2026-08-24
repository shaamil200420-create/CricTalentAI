import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/coach', end: true, icon: 'dashboard', label: 'Dashboard' },
      { to: '/coach/players', icon: 'groups', label: 'Player List' },
    ],
  },
  {
    label: 'Records',
    items: [
      { to: '/coach/match-entry', icon: 'edit_note', label: 'Match Entry' },
      { to: '/coach/match-records', icon: 'history_edu', label: 'Match Records' },
      { to: '/coach/training-entry', icon: 'fitness_center', label: 'Training Entry' },
      { to: '/coach/schedules', icon: 'calendar_month', label: 'Schedule Management' },
    ],
  },
  {
    label: 'AI & Coaching',
    items: [
      { to: '/coach/comparison', icon: 'compare_arrows', label: 'Player Comparison' },
      { to: '/coach/ai-predictions', icon: 'bolt', label: 'AI Prediction View' },
      { to: '/coach/recommendations', icon: 'thumb_up', label: 'Training Recommendation', badge: 1 },
      { to: '/coach/development-plans', icon: 'model_training', label: 'Development Plan' },
      { to: '/coach/goals', icon: 'flag', label: 'Goal Tracking' },
    ],
  },
  {
    label: 'Reports',
    items: [{ to: '/coach/reports', icon: 'assessment', label: 'Reports' }],
  },
];

export default function CoachLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell
      portalLabel="Coach Portal"
      navGroups={NAV_GROUPS}
      identity={session?.identity}
      onLogout={() => { logout(); navigate('/login'); }}
      headerTitle="Coach Portal"
      headerSubtitle="Record management & AI-supported coaching"
      variant="coach"
    />
  );
}
