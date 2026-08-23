import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge, Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import { PLAYERS, MATCH_PERFORMANCE_P001, MATCHES, FEEDBACK_P001 as INITIAL_FEEDBACK } from '../../data/mockData.js';
import { PLAYER_ROLES, strikeRate, formatNumber } from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function CoachPlayers() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [viewTarget, setViewTarget] = useState(null);

  const filtered = useMemo(() => PLAYERS.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesQuery && matchesRole;
  }), [query, roleFilter]);

  return (
    <>
      <PageHeader title="Player List" subtitle="Your assigned squad — profile, stats and feedback in one view" />

      <div className="table-toolbar">
        <div className="table-search"><Icon name="search" /><Input placeholder="Search by name or ID…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="filter-row">
          {['All', ...PLAYER_ROLES].map((r) => (
            <Button key={r} size="sm" variant={roleFilter === r ? 'primary' : 'secondary'} onClick={() => setRoleFilter(r)}>{r}</Button>
          ))}
        </div>
      </div>

      <DataTable
        rows={filtered}
        rowKey="id"
        emptyTitle="No matching players"
        columns={[
          { key: 'id', header: 'ID', render: (p) => <span className="mono">{p.id}</span> },
          { key: 'name', header: 'Name' },
          { key: 'age', header: 'Age' },
          { key: 'role', header: 'Role' },
          { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          { key: 'actions', header: '', render: (p) => <Button size="sm" variant="secondary" icon="visibility" onClick={() => setViewTarget(p)}>View</Button> },
        ]}
      />

      {viewTarget && <PlayerDetailModal player={viewTarget} onClose={() => setViewTarget(null)} />}
    </>
  );
}

function PlayerDetailModal({ player, onClose }) {
  const [tab, setTab] = useState('overview');
  const hasDemoData = player.id === 'P001';
  const [feedback, setFeedback] = useState(hasDemoData ? INITIAL_FEEDBACK : []);
  const [note, setNote] = useState({ text: '', strengths: '', areasToImprove: '', visibility: 'PLAYER_VISIBLE' });
  const { showToast } = useToast();

  const addFeedback = () => {
    if (!note.text.trim()) return;
    setFeedback((list) => [{ id: `F${String(list.length + 1).padStart(3, '0')}`, date: new Date().toISOString().slice(0, 10), ...note }, ...list]);
    showToast('Feedback saved (demo only).');
    setNote({ text: '', strengths: '', areasToImprove: '', visibility: 'PLAYER_VISIBLE' });
  };

  return (
    <Modal open onClose={onClose} title={player.name} subtitle={`${player.id} · ${player.role}`} wide footer={<Button variant="primary" onClick={onClose}>Close</Button>}>
      <Tabs
        tabs={[{ value: 'overview', label: 'Overview' }, { value: 'stats', label: 'Match Stats' }, { value: 'feedback', label: 'Coach Feedback' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="form-grid">
          <FormField label="Batting Style"><Input disabled value={player.battingStyle} /></FormField>
          <FormField label="Bowling Style"><Input disabled value={player.bowlingStyle} /></FormField>
          <FormField label="Height"><Input disabled value={`${player.heightCm} cm`} /></FormField>
          <FormField label="Weight"><Input disabled value={`${player.weightKg} kg`} /></FormField>
        </div>
      )}

      {tab === 'stats' && (
        hasDemoData ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Match</th><th>Runs</th><th>Balls</th><th>SR</th><th>4s</th><th>6s</th></tr></thead>
              <tbody>
                {MATCH_PERFORMANCE_P001.map((m) => {
                  const match = MATCHES.find((x) => x.id === m.matchId);
                  return (
                    <tr key={m.matchId}>
                      <td>{match ? `${formatDate(match.date)} vs ${match.opponent}` : m.matchId}</td>
                      <td>{m.runs}{!m.isOut ? '*' : ''}</td>
                      <td>{m.ballsFaced}</td>
                      <td>{formatNumber(strikeRate(m.runs, m.ballsFaced))}</td>
                      <td>{m.fours}</td>
                      <td>{m.sixes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-faint" style={{ fontSize: 13 }}>No match performance recorded yet for {player.name} in this demo dataset.</p>
        )
      )}

      {tab === 'feedback' && (
        <div>
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <FormField label="Feedback" full><Textarea rows={2} value={note.text} onChange={(e) => setNote((n) => ({ ...n, text: e.target.value }))} placeholder="What did you observe?" /></FormField>
            <FormField label="Strengths"><Input value={note.strengths} onChange={(e) => setNote((n) => ({ ...n, strengths: e.target.value }))} /></FormField>
            <FormField label="Areas to Improve"><Input value={note.areasToImprove} onChange={(e) => setNote((n) => ({ ...n, areasToImprove: e.target.value }))} /></FormField>
            <FormField label="Visibility" hint="PLAYER_VISIBLE shows on their My Feedback page. PRIVATE stays coach-only.">
              <Select value={note.visibility} onChange={(e) => setNote((n) => ({ ...n, visibility: e.target.value }))}>
                <option value="PLAYER_VISIBLE">Player Visible</option>
                <option value="PRIVATE">Private (coach only)</option>
              </Select>
            </FormField>
          </div>
          <Button variant="primary" icon="add_comment" onClick={addFeedback} disabled={!note.text.trim()}>Add Feedback</Button>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {feedback.map((f) => (
              <li key={f.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="text-faint mono" style={{ fontSize: 11 }}>{formatDate(f.date)}</span>
                  <Badge tone={f.visibility === 'PRIVATE' ? 'neutral' : 'primary'}>{f.visibility === 'PRIVATE' ? 'Private' : 'Player Visible'}</Badge>
                </div>
                <p style={{ margin: 0, fontSize: 13 }}>{f.text}</p>
              </li>
            ))}
            {!feedback.length && <p className="text-faint" style={{ fontSize: 13 }}>No feedback recorded yet.</p>}
          </ul>
        </div>
      )}
    </Modal>
  );
}
