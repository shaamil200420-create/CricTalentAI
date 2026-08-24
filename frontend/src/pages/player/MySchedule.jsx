import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { Badge, StatusBadge } from '../../components/Badge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';
import { sortByDateTime } from '../../utils/format.js';

// Player -> My Schedule is VIEW-ONLY over the SAME shared records Admin
// Schedule Management and Coach Matches/Training read and write
// (GET /api/matches + GET /api/schedules) — no separate "player copy",
// and no create/edit/cancel/delete affordances for this role. An edit or
// cancel made by Admin/Coach shows up here automatically on next load; an
// accidental schedule that gets deleted simply stops appearing.
export default function MySchedule() {
  const [items, setItems] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([apiRequest('/matches'), apiRequest('/schedules')])
      .then(([matches, trainings]) => {
        const matchItems = matches.map((m) => ({
          id: m.id, kind: 'Match', title: `vs ${m.opponent}`, date: m.date, time: m.time, venue: m.venue, status: m.status,
        }));
        const trainingItems = trainings.map((s) => ({
          id: s.id, kind: 'Training', title: s.title, date: s.date, time: s.time, venue: s.venue, status: s.status,
        }));
        setItems(sortByDateTime([...matchItems, ...trainingItems]));
      })
      .catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader title="My Schedule" subtitle="Upcoming matches and training sessions — view-only" />

      <Card title="My Schedule" kicker="Managed by coach/admin">
        <div>
          {items.map((s) => {
            const d = new Date(s.date);
            const day = Number.isNaN(d.getTime()) ? '—' : d.getDate();
            const month = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { month: 'short' });
            return (
              <div className="pp-schedule-card" key={`${s.kind}-${s.id}`}>
                <div className="pp-schedule-date">
                  <div className="pp-schedule-day">{day}</div>
                  <div className="pp-schedule-month">{month}</div>
                </div>
                <div className="pp-schedule-divider" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pp-schedule-title">{s.title}</div>
                  <div className="pp-schedule-meta">{s.time || '—'} · {s.venue}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <Badge tone={s.kind === 'Match' ? 'cyan' : 'primary'}>{s.kind}</Badge>
                  {s.status !== 'Scheduled' && <StatusBadge status={s.status} />}
                </div>
              </div>
            );
          })}
          {!items.length && <p className="text-faint" style={{ fontSize: 13 }}>No upcoming items scheduled yet.</p>}
        </div>
      </Card>
    </>
  );
}
