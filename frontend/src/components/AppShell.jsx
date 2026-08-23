import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopHeader from './TopHeader.jsx';

export default function AppShell({ portalLabel, navGroups, identity, onLogout, headerTitle, headerSubtitle }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        portalLabel={portalLabel}
        navGroups={navGroups}
        identity={identity}
        onLogout={onLogout}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="main-col">
        <TopHeader title={headerTitle} subtitle={headerSubtitle} onMenuClick={() => setMobileOpen(true)} />
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
