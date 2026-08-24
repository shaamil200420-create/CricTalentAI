import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { StatCard, Card } from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { PersonRow } from '../../components/InitialAvatar.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

const EMPTY = { totalUsers: 0, activeCoaches: 0, activePlayers: 0, ongoingTournaments: 0, recentUsers: [], tournaments: [] };

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    apiRequest('/admin/dashboard').then(setData).catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-legacy">
      <PageHeader title="Admin Dashboard" subtitle="System overview and management" />

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Users" value={data.totalUsers} icon={<Icon name="manage_accounts" />} sub={<><Icon name="trending_up" size={14} />all roles</>} />
        <StatCard label="Active Coaches" value={String(data.activeCoaches).padStart(2, '0')} icon={<Icon name="sports_cricket" />} tone="cyan" sub="of the academy roster" />
        <StatCard label="Active Players" value={data.activePlayers} icon={<Icon name="groups" />} tone="amber" sub="U19 roster" />
        <StatCard label="Ongoing Tournaments" value={data.ongoingTournaments} icon={<Icon name="emoji_events" />} tone="error" sub={`${data.tournaments.length} total on record`} />
      </div>

      <div className="grid-2">
        <Card
          kicker="Accounts"
          title="Recently Added Users"
          subtitle="Latest registered coaches and players"
        >
          <DataTable
            rows={data.recentUsers}
            columns={[
              { key: 'name', header: 'Name', render: (u) => <PersonRow name={u.name} /> },
              { key: 'role', header: 'Role', render: (u) => <span className="mono">{u.role}</span> },
              { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
            ]}
          />
        </Card>
        <Card kicker="Academy" title="Tournaments">
          <DataTable
            rows={data.tournaments}
            columns={[
              { key: 'name', header: 'Tournament', render: (t) => <>{t.name} <span className="text-faint mono" style={{ fontSize: 11 }}>· {t.format}</span></> },
              { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
            ]}
          />
        </Card>
      </div>

      <Card kicker="Data note" style={{ marginTop: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          These figures are live counts from the MySQL database via <code className="mono">GET /api/admin/dashboard</code>.
          "Recently Added Users" reflects Admin/Coach/Player accounts created through this Admin Portal.
        </p>
      </Card>
    </div>
  );
}
