import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: '/admin', end: true, icon: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Accounts',
    items: [
      { to: '/admin/users', icon: 'manage_accounts', label: 'User Management' },
      { to: '/admin/admins', icon: 'admin_panel_settings', label: 'Admin Management' },
      { to: '/admin/coaches', icon: 'sports_cricket', label: 'Coach Management' },
      { to: '/admin/players', icon: 'groups', label: 'Player Management' },
    ],
  },
  {
    label: 'Academy',
    items: [
      { to: '/admin/tournaments', icon: 'emoji_events', label: 'Tournament Management' },
      { to: '/admin/schedules', icon: 'calendar_month', label: 'Schedule Management' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/reports', icon: 'assessment', label: 'Reports' },
      { to: '/admin/settings', icon: 'settings', label: 'Settings' },
    ],
  },
];

export default function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell
      portalLabel="Admin Portal"
      navGroups={NAV_GROUPS}
      identity={session?.identity}
      onLogout={() => { logout(); navigate('/login'); }}
      headerTitle="Admin Portal"
      headerSubtitle="System administration"
    />
  );
}
