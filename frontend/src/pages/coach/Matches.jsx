import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Button from '../../components/Button.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import { MATCHES, MATCH_PERFORMANCE_P001, PLAYERS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

export default function CoachMatches() {
  const [detail, setDetail] = useState(null);
  const p001 = PLAYERS.find((p) => p.id === 'P001');
  const performance = detail ? MATCH_PERFORMANCE_P001.find((m) => m.matchId === detail.id) : null;

  return (
    <>
      <PageHeader title="Matches" subtitle="Match history across the current season" />

      <DataTable
        rows={MATCHES}
        emptyTitle="No matches recorded yet"
        columns={[
          { key: 'date', header: 'Date', render: (m) => formatDate(m.date) },
          { key: 'opponent', header: 'Opponent' },
          { key: 'venue', header: 'Venue' },
          { key: 'tournament', header: 'Tournament', render: (m) => m.tournament || <span className="text-faint">—</span> },
          { key: 'result', header: 'Result', render: (m) => <StatusBadge status={m.result} /> },
          { key: 'actions', header: '', render: (m) => <Button size="sm" variant="secondary" icon="visibility" onClick={() => setDetail(m)}>View</Button> },
        ]}
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.opponent} — ${formatDate(detail.date)}` : ''} footer={<Button variant="primary" onClick={() => setDetail(null)}>Close</Button>}>
        <p style={{ fontSize: 13, marginTop: 0 }}><strong>Venue:</strong> {detail?.venue}</p>
        <p style={{ fontSize: 13 }}><strong>Result:</strong> {detail?.result}</p>
        {performance ? (
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="data-table">
              <thead><tr><th>Player</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>Catches</th></tr></thead>
              <tbody>
                <tr>
                  <td>{p001?.name}</td>
                  <td>{performance.runs}{!performance.isOut ? '*' : ''}</td>
                  <td>{performance.ballsFaced}</td>
                  <td>{performance.fours}</td>
                  <td>{performance.sixes}</td>
                  <td>{performance.catches}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-faint" style={{ fontSize: 12.5, marginTop: 10 }}>No demo performance data recorded for this match.</p>
        )}
      </Modal>
    </>
  );
}
