import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { TOURNAMENTS as INITIAL_TOURNAMENTS, PLAYERS, MATCHES as INITIAL_MATCHES } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

const RESULT_OPTIONS = ['Win', 'Loss', 'No Result'];

export default function TournamentManagement() {
  const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teams, setTeams] = useState(6);

  const openAdd = () => { setEditing(null); setName(''); setStartDate(''); setEndDate(''); setTeams(6); setFormOpen(true); };
  const openEdit = (t) => { setEditing(t); setName(t.name); setStartDate(t.startDate); setEndDate(t.endDate); setTeams(t.teams); setFormOpen(true); };

  const save = () => {
    if (editing) {
      setTournaments((list) => list.map((t) => (t.id === editing.id ? { ...t, name, startDate, endDate, teams: Number(teams) } : t)));
      showToast('Tournament updated (demo only).');
    } else {
      setTournaments((list) => [...list, {
        id: `T${String(list.length + 1).padStart(3, '0')}`, name, format: 'T20', startDate, endDate,
        status: 'Upcoming', teams: Number(teams), assignedPlayers: [],
      }]);
      showToast('Tournament created (demo only).');
    }
    setFormOpen(false);
  };

  const togglePlayer = (tournamentId, playerId) => {
    setTournaments((list) => list.map((t) => {
      if (t.id !== tournamentId) return t;
      const has = t.assignedPlayers.includes(playerId);
      return { ...t, assignedPlayers: has ? t.assignedPlayers.filter((id) => id !== playerId) : [...t.assignedPlayers, playerId] };
    }));
  };

  const addMatch = (tournamentName, { opponent, date, venue }) => {
    setMatches((list) => [...list, {
      id: `M${String(list.length + 1).padStart(3, '0')}`,
      date, opponent, venue, tournament: tournamentName, format: 'T20', status: 'Scheduled', result: null,
    }]);
    showToast('Match added to the tournament (demo only).');
  };

  const recordResult = (matchId, result) => {
    setMatches((list) => list.map((m) => (m.id === matchId ? { ...m, result, status: 'Completed' } : m)));
    showToast('Match result saved (demo only).');
  };

  const detail = tournaments.find((t) => t.id === detailTarget?.id);

  return (
    <>
      <PageHeader title="Tournament Management" subtitle="Manage tournaments, matches and results (FR6 · T20 only)" actions={<Button icon="add" onClick={openAdd}>Create Tournament</Button>} />

      <DataTable
        rows={tournaments}
        emptyTitle="No tournaments yet"
        columns={[
          { key: 'name', header: 'Tournament' },
          { key: 'format', header: 'Format', render: () => <span className="mono">T20</span> },
          { key: 'dates', header: 'Dates', render: (t) => `${formatDate(t.startDate)} – ${formatDate(t.endDate)}` },
          { key: 'teams', header: 'Teams' },
          { key: 'assigned', header: 'Players Assigned', render: (t) => `${t.assignedPlayers.length}` },
          { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
          {
            key: 'actions', header: '',
            render: (t) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary" icon="visibility" onClick={() => setDetailTarget(t)}>Manage</Button>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => openEdit(t)}>Edit</Button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Tournament' : 'Create Tournament'}
        footer={<><Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button variant="primary" icon="save" onClick={save} disabled={!name}>Save</Button></>}>
        <div className="form-grid">
          <FormField label="Tournament Name" full><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Academy T20 Trophy" /></FormField>
          <FormField label="Format"><Select value="T20" disabled><option>T20</option></Select></FormField>
          <FormField label="Teams"><Input type="number" min="2" value={teams} onChange={(e) => setTeams(e.target.value)} /></FormField>
          <FormField label="Start Date"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></FormField>
          <FormField label="End Date"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></FormField>
        </div>
      </Modal>

      {detail && (
        <TournamentDetailModal
          tournament={detail}
          matches={matches}
          onClose={() => setDetailTarget(null)}
          onTogglePlayer={(pid) => togglePlayer(detail.id, pid)}
          onAddMatch={(payload) => addMatch(detail.name, payload)}
          onRecordResult={recordResult}
        />
      )}
    </>
  );
}

function TournamentDetailModal({ tournament, matches, onClose, onTogglePlayer, onAddMatch, onRecordResult }) {
  const [tab, setTab] = useState('players');
  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [resultTarget, setResultTarget] = useState(null);
  const relatedMatches = matches.filter((m) => m.tournament === tournament.name);

  return (
    <Modal open onClose={onClose} title={tournament.name} subtitle="T20 · assign players and review match history" wide
      footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <Tabs
        tabs={[{ value: 'players', label: 'Assign Players' }, { value: 'matches', label: 'Match History' }]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'players' ? (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PLAYERS.map((p) => (
            <li key={p.id}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 8 }}>
                <input type="checkbox" checked={tournament.assignedPlayers.includes(p.id)} onChange={() => onTogglePlayer(p.id)} />
                <span style={{ fontSize: 13.5 }}>{p.name}</span>
                <span className="text-faint mono" style={{ fontSize: 11 }}>{p.id} · {p.role}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Button size="sm" icon="add" onClick={() => setAddMatchOpen(true)}>Add Match</Button>
          </div>
          <MatchHistoryTable matches={relatedMatches} onRecordResult={(m) => setResultTarget(m)} />
        </>
      )}

      {addMatchOpen && (
        <AddMatchModal
          tournamentName={tournament.name}
          onClose={() => setAddMatchOpen(false)}
          onSave={(payload) => { onAddMatch(payload); setAddMatchOpen(false); }}
        />
      )}

      {resultTarget && (
        <ResultModal
          match={resultTarget}
          onClose={() => setResultTarget(null)}
          onSave={(result) => { onRecordResult(resultTarget.id, result); setResultTarget(null); }}
        />
      )}
    </Modal>
  );
}

function MatchHistoryTable({ matches, onRecordResult }) {
  if (!matches.length) {
    return <p className="text-faint" style={{ fontSize: 13 }}>No matches added to this tournament yet. Use "Add Match" above to schedule one.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Date</th><th>Opponent</th><th>Venue</th><th>Status</th><th>Result</th><th></th></tr></thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <td>{formatDate(m.date)}</td>
              <td>{m.opponent}</td>
              <td>{m.venue}</td>
              <td><StatusBadge status={m.status} /></td>
              <td>{m.result ? <StatusBadge status={m.result} /> : <span className="text-faint">—</span>}</td>
              <td style={{ textAlign: 'right' }}>
                <Button size="sm" variant="secondary" icon={m.result ? 'edit' : 'flag'} onClick={() => onRecordResult(m)}>
                  {m.result ? 'Edit Result' : 'Record Result'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddMatchModal({ tournamentName, onClose, onSave }) {
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');

  return (
    <Modal open onClose={onClose} title="Add Match" subtitle={`${tournamentName} · T20`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" disabled={!opponent || !date || !venue} onClick={() => onSave({ opponent, date, venue })}>Save Match</Button>
      </>}>
      <div className="form-grid">
        <FormField label="Tournament"><Input value={tournamentName} disabled /></FormField>
        <FormField label="Format"><Select value="T20" disabled><option>T20</option></Select></FormField>
        <FormField label="Opponent" full><Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Metro Falcons" /></FormField>
        <FormField label="Match Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Venue"><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Central Academy Oval" /></FormField>
      </div>
      <p className="text-faint" style={{ fontSize: 11.5, marginTop: 4, marginBottom: 0 }}>
        New matches start as <strong>Scheduled</strong> — use "Record Result" once the match has been played (demo only).
      </p>
    </Modal>
  );
}

function ResultModal({ match, onClose, onSave }) {
  const [result, setResult] = useState(match.result || RESULT_OPTIONS[0]);

  return (
    <Modal open onClose={onClose} title={match.result ? 'Edit Result' : 'Record Result'} subtitle={`${match.opponent} · ${formatDate(match.date)}`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={() => onSave(result)}>Save Result</Button>
      </>}>
      <FormField label="Result">
        <Select value={result} onChange={(e) => setResult(e.target.value)}>
          {RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r === 'Win' ? 'Won' : r === 'Loss' ? 'Lost' : 'No Result'}</option>)}
        </Select>
      </FormField>
      <p className="text-faint" style={{ fontSize: 11.5, marginTop: 4, marginBottom: 0 }}>
        Saving marks this match as <strong>Completed</strong> and updates Tournament History (demo only).
      </p>
    </Modal>
  );
}
