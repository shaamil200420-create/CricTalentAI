import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge, Badge } from '../../components/Badge.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatDate } from '../../utils/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../services/api.js';

// Player -> My Training Records reads the SAME real MySQL Training
// Records Coach -> Training Entry creates (GET
// /training-records/player/{myId}) — never a hard-coded P001 or mock
// data. VIEW ONLY — no Add/Edit/Remove affordances anywhere on this page.
export default function MyTrainingRecords() {
  const { session } = useAuth();
  const [records, setRecords] = useState(null); // null = still loading

  useEffect(() => {
    if (!session?.identity?.id || session.demo) {
      setRecords([]);
      return;
    }
    const myId = session.identity.id;
    Promise.all([
      apiRequest(`/training-records/player/${myId}`),
      apiRequest('/schedules'),
    ]).then(([trainingRecords, schedules]) => {
      setRecords(trainingRecords.map((r) => ({
        ...r,
        session: schedules.find((s) => s.id === r.sessionId),
      })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <>
      <PageHeader title="My Training Records" subtitle="Attendance, drills and scores recorded by your coach — view-only" />

      <Card title="Training Sessions" kicker="Coach-entered · view only">
        {records === null ? (
          <EmptyState icon="fitness_center" title="Loading your training records…" hint="Fetching your recorded sessions." />
        ) : !records.length ? (
          <EmptyState icon="fitness_center" title="No training records yet" hint="Your attendance and scores will appear here once your Coach logs a training session for you." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Session</th><th>Date</th><th>Attendance</th><th>Drills</th><th>Fitness</th><th>Coach Rating</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name={r.session?.trainingType === 'Bowling' ? 'sports_baseball' : r.session?.trainingType === 'Fitness' ? 'fitness_center' : 'sports_cricket'} size={16} style={{ color: 'var(--color-primary)' }} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{r.session?.title ?? r.sessionId}</div>
                          {r.session?.trainingType && <Badge tone="neutral">{r.session.trainingType}</Badge>}
                        </div>
                      </div>
                    </td>
                    <td>{r.session ? formatDate(r.session.date) : '—'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon
                          name={r.attendance === 'Present' ? 'check_circle' : 'cancel'}
                          filled
                          size={16}
                          style={{ color: r.attendance === 'Present' ? 'var(--color-primary)' : 'var(--color-error)' }}
                        />
                        <StatusBadge status={r.attendance} />
                      </span>
                    </td>
                    <td>{r.attendance === 'Absent' ? '—' : `${r.drillsCompleted ?? 0}/${r.drillsAssigned ?? 0}`}</td>
                    <td>{r.fitnessScore ?? '—'}</td>
                    <td>{r.coachRating ?? '—'}</td>
                    <td style={{ maxWidth: 260 }}>{r.notes || <span className="text-faint">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
