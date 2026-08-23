import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import { GOALS_P001 } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

export default function MyGoals() {
  return (
    <>
      <PageHeader title="My Goals" subtitle="Goals set by your coach — view-only" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {GOALS_P001.map((g) => (
          <Card key={g.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>{g.focusArea}</span>
              <StatusBadge status={g.status} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{g.target}</p>
            <p className="text-faint mono" style={{ fontSize: 11, margin: '6px 0 0' }}>Deadline: {formatDate(g.deadline)}</p>
            <div style={{ marginTop: 10, maxWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                <span className="text-faint">Progress</span><span className="mono">{g.progressPct}%</span>
              </div>
              <ProgressBar value={g.progressPct} />
            </div>
          </Card>
        ))}
        {!GOALS_P001.length && <Card><p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No goals set yet.</p></Card>}
      </div>
    </>
  );
}
