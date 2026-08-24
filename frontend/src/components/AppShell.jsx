import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopHeader from './TopHeader.jsx';

export default function AppShell({
  portalLabel, navGroups, identity, onLogout, headerTitle, headerSubtitle,
  variant, brandIcon, statusPill, headerRight,
}) {
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
        variant={variant}
        brandIcon={brandIcon}
      />
      <div className="main-col">
        <TopHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          onMenuClick={() => setMobileOpen(true)}
          statusPill={statusPill}
          right={headerRight}
          variant={variant}
          identity={variant === 'admin' ? identity : undefined}
        />
        <div className={`page-body${variant ? ` page-body--${variant}` : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
