import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import { DEVELOPMENT_PLANS_P001 } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

export default function MyDevelopmentReport() {
  return (
    <>
      <PageHeader title="My Development Report" subtitle="Your individual development plan, set by your coach — view-only" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DEVELOPMENT_PLANS_P001.map((p) => (
          <Card key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>{p.focusArea}</span>
              <StatusBadge status={p.status} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{p.objective}</p>
            <p className="text-faint mono" style={{ fontSize: 11, margin: '6px 0 0' }}>{formatDate(p.startDate)} → {formatDate(p.targetDate)}</p>
            {p.notes && <p className="text-faint" style={{ fontSize: 12, marginTop: 6 }}>{p.notes}</p>}
            <div style={{ marginTop: 10, maxWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                <span className="text-faint">Progress</span><span className="mono">{p.progressPct}%</span>
              </div>
              <ProgressBar value={p.progressPct} />
            </div>
          </Card>
        ))}
        {!DEVELOPMENT_PLANS_P001.length && <Card><p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No development plan has been set yet.</p></Card>}
      </div>
    </>
  );
}
