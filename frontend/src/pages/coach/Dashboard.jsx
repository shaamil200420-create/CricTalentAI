import PageHeader from '../../components/PageHeader.jsx';
import { StatCard, Card } from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { Badge } from '../../components/Badge.jsx';
import { PersonRow } from '../../components/InitialAvatar.jsx';
import { PLAYERS, SCHEDULE_ITEMS, PERFORMANCE_ALERTS, TOP_PERFORMERS, AI_PREDICTIONS_P001 } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

const SEVERITY_TONE = { high: 'error', medium: 'warn', low: 'info' };

export default function CoachDashboard() {
  const activePlayers = PLAYERS.filter((p) => p.status === 'Active').length;
  const upcoming = SCHEDULE_ITEMS.filter((s) => s.kind).slice(0, 4);
  const pendingRecs = AI_PREDICTIONS_P001.filter((p) => p.reviewStatus === 'PENDING').length;

  return (
    <>
      <PageHeader title="Coach Dashboard" subtitle="Squad overview, alerts and AI-supported coaching (FR7)" />

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Active Players" value={activePlayers} icon={<Icon name="groups" />} sub={`of ${PLAYERS.length} on roster`} />
        <StatCard label="Upcoming Schedule" value={SCHEDULE_ITEMS.length} icon={<Icon name="event" />} tone="cyan" sub="matches + training" />
        <StatCard label="Pending Recommendations" value={pendingRecs} icon={<Icon name="thumb_up" />} tone="amber" sub="awaiting your review" />
        <StatCard label="Active Alerts" value={PERFORMANCE_ALERTS.length} icon={<Icon name="notifications_active" />} tone="error" sub="need attention" />
      </div>

      <div className="grid-2">
        <Card kicker="Form" title="Top Performers (recent)">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TOP_PERFORMERS.map((p) => (
              <li key={p.player + p.metric} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, gap: 12 }}>
                <PersonRow name={p.player} size={32} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className="text-faint" style={{ fontSize: 11 }}>{p.metric}</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{p.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card kicker="Watchlist" title="Performance Alerts">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERFORMANCE_ALERTS.map((a) => (
              <li key={a.id} className="alert-item">
                <Badge tone={SEVERITY_TONE[a.severity]} dot>{a.severity}</Badge>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{a.player} — {a.area}</p>
                  <p className="text-faint" style={{ margin: '2px 0 0', fontSize: 12 }}>{a.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card kicker="Next up" title="Upcoming Schedule" style={{ marginTop: 20 }}>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {upcoming.map((s) => (
            <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span><Badge tone={s.kind === 'Match' ? 'cyan' : 'primary'}>{s.kind}</Badge> &nbsp;{s.title}</span>
              <span className="text-faint mono" style={{ fontSize: 11.5 }}>{formatDate(s.date)} · {s.time} · {s.venue}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card kicker="Data note" style={{ marginTop: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Alerts, form and predictions above are Phase 2 demo placeholders from <code className="mono">src/data/mockData.js</code>.
          Real alert generation and model-backed scores arrive with the AI service (Phase 14).
        </p>
      </Card>
    </>
  );
}
