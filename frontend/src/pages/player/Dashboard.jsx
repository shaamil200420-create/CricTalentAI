import PageHeader from '../../components/PageHeader.jsx';
import { StatCard, Card } from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { Badge } from '../../components/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { MATCH_PERFORMANCE_P001, TRAINING_RECORDS_P001, SCHEDULE_ITEMS, GOALS_P001 } from '../../data/mockData.js';
import { strikeRate, formatNumber } from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';

export default function PlayerDashboard() {
  const { session } = useAuth();
  const identity = session?.identity;

  const recentRuns = MATCH_PERFORMANCE_P001.reduce((s, m) => s + m.runs, 0);
  const totalBalls = MATCH_PERFORMANCE_P001.reduce((s, m) => s + m.ballsFaced, 0);
  const lastFitness = [...TRAINING_RECORDS_P001].reverse().find((r) => r.fitnessScore != null)?.fitnessScore;
  const upcoming = SCHEDULE_ITEMS.slice(0, 3);
  const activeGoals = GOALS_P001.filter((g) => g.status === 'In Progress').length;

  return (
    <>
      <PageHeader title={`Welcome, ${identity?.name?.split(' ')[0] ?? 'Player'}`} subtitle="Your progress, at a glance — everything here is view-only" />

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Runs (last 5 innings)" value={recentRuns} icon={<Icon name="sports_cricket" />} />
        <StatCard label="Strike Rate" value={formatNumber(strikeRate(recentRuns, totalBalls))} icon={<Icon name="speed" />} tone="cyan" />
        <StatCard label="Latest Fitness Score" value={lastFitness != null ? `${lastFitness}/100` : '—'} icon={<Icon name="favorite" />} tone="amber" />
        <StatCard label="Active Goals" value={activeGoals} icon={<Icon name="flag" />} tone="error" />
      </div>

      <Card kicker="Next up" title="Upcoming Schedule">
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {upcoming.map((s) => (
            <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span><Badge tone={s.kind === 'Match' ? 'cyan' : 'primary'}>{s.kind}</Badge> &nbsp;{s.title}</span>
              <span className="text-faint mono" style={{ fontSize: 11.5 }}>{formatDate(s.date)} · {s.time}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card kicker="Data note" style={{ marginTop: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Your stats come from the Phase 2 demo dataset. Live figures replace these once the Coach Portal starts recording
          real Match and Training entries against your profile.
        </p>
      </Card>
    </>
  );
}
