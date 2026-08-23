import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { TRAINING_RECORDS_P001, TRAINING_SESSIONS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

export default function MyTrainingRecords() {
  return (
    <>
      <PageHeader title="My Training Records" subtitle="Attendance, drills and scores recorded by your coach — view-only" />

      <Card>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Session</th><th>Date</th><th>Attendance</th><th>Drills</th><th>Fitness</th><th>Coach Rating</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {TRAINING_RECORDS_P001.map((r) => {
                const session = TRAINING_SESSIONS.find((s) => s.id === r.sessionId);
                return (
                  <tr key={r.sessionId}>
                    <td>{session?.name ?? r.sessionId}</td>
                    <td>{session ? formatDate(session.date) : '—'}</td>
                    <td><StatusBadge status={r.attendance} /></td>
                    <td>{r.attendance === 'Absent' ? '—' : `${r.drillsCompleted}/${r.drillsAssigned}`}</td>
                    <td>{r.fitnessScore ?? '—'}</td>
                    <td>{r.coachRating ?? '—'}</td>
                    <td style={{ maxWidth: 260 }}>{r.coachNotes || <span className="text-faint">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
