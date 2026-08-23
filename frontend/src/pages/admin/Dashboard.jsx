import PageHeader from '../../components/PageHeader.jsx';
import { StatCard, Card } from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { USERS, PLAYERS, COACHES, TOURNAMENTS } from '../../data/mockData.js';

export default function AdminDashboard() {
  const activeCoaches = COACHES.filter((c) => c.status === 'Active').length;
  const activePlayers = PLAYERS.filter((p) => p.status === 'Active').length;
  const ongoingTournaments = TOURNAMENTS.filter((t) => t.status === 'Ongoing').length;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="System overview and management" />

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Users" value={USERS.length} icon={<Icon name="manage_accounts" />} sub={<><Icon name="trending_up" size={14} />all roles</>} />
        <StatCard label="Active Coaches" value={String(activeCoaches).padStart(2, '0')} icon={<Icon name="sports_cricket" />} tone="cyan" sub="of the academy roster" />
        <StatCard label="Active Players" value={activePlayers} icon={<Icon name="groups" />} tone="amber" sub="U19 roster" />
        <StatCard label="Ongoing Tournaments" value={ongoingTournaments} icon={<Icon name="emoji_events" />} tone="error" sub={`${TOURNAMENTS.length} total on record`} />
      </div>

      <div className="grid-2">
        <Card kicker="Accounts" title="Recently Added Users">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {USERS.slice(0, 5).map((u) => (
              <li key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{u.name} <span className="text-faint mono" style={{ fontSize: 11 }}>· {u.role}</span></span>
                <StatusBadge status={u.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card kicker="Academy" title="Tournaments">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TOURNAMENTS.map((t) => (
              <li key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{t.name} <span className="text-faint mono" style={{ fontSize: 11 }}>· {t.format}</span></span>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card kicker="Data note" style={{ marginTop: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Every number on this dashboard comes from the Phase 2 demo dataset (<code className="mono">src/data/mockData.js</code>) —
          it will be replaced by live MySQL-backed queries once the Admin core APIs exist (Phase 6).
        </p>
      </Card>
    </>
  );
}
