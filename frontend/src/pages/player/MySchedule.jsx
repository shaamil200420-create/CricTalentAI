import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { Badge } from '../../components/Badge.jsx';
import { SCHEDULE_ITEMS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

export default function MySchedule() {
  return (
    <>
      <PageHeader title="My Schedule" subtitle="Upcoming matches and training sessions — view-only" />

      <Card>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SCHEDULE_ITEMS.map((s) => (
            <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span><Badge tone={s.kind === 'Match' ? 'cyan' : 'primary'}>{s.kind}</Badge> &nbsp;{s.title}</span>
              <span className="text-faint mono" style={{ fontSize: 11.5 }}>{formatDate(s.date)} · {s.time} · {s.venue}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
