import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Button from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import { TRAINING_SESSIONS, TRAINING_RECORDS_P001, PLAYERS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

const TYPE_TONE = { Batting: 'primary', Bowling: 'cyan', Fitness: 'amber' };

export default function CoachTraining() {
  const [detail, setDetail] = useState(null);
  const p001 = PLAYERS.find((p) => p.id === 'P001');
  const record = detail ? TRAINING_RECORDS_P001.find((r) => r.sessionId === detail.id) : null;

  return (
    <>
      <PageHeader title="Training" subtitle="Scheduled training sessions and recorded attendance" />

      <DataTable
        rows={TRAINING_SESSIONS}
        emptyTitle="No training sessions scheduled"
        columns={[
          { key: 'name', header: 'Session' },
          { key: 'type', header: 'Type', render: (s) => <Badge tone={TYPE_TONE[s.type]}>{s.type}</Badge> },
          { key: 'date', header: 'Date', render: (s) => formatDate(s.date) },
          { key: 'time', header: 'Time', render: (s) => <span className="mono">{s.time}</span> },
          { key: 'venue', header: 'Venue' },
          { key: 'actions', header: '', render: (s) => <Button size="sm" variant="secondary" icon="visibility" onClick={() => setDetail(s)}>View Attendance</Button> },
        ]}
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} subtitle={detail && `${formatDate(detail.date)} · ${detail.time} · ${detail.venue}`} footer={<Button variant="primary" onClick={() => setDetail(null)}>Close</Button>}>
        {record ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Attendance</th><th>Fitness</th><th>Coach Rating</th></tr></thead>
              <tbody>
                <tr>
                  <td>{p001?.name}</td>
                  <td>{record.attendance}</td>
                  <td>{record.fitnessScore ?? '—'}</td>
                  <td>{record.coachRating ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-faint" style={{ fontSize: 12.5 }}>No demo attendance record for this session yet.</p>
        )}
      </Modal>
    </>
  );
}
