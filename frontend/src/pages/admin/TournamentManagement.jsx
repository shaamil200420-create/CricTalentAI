import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Tabs from '../../components/Tabs.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { PLAYERS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

const RESULT_OPTIONS = ['Win', 'Loss', 'No Result'];

// "Assign Players" (tournament <-> player) stays a frontend-only grouping,
// same as Coach Management's Assigned Players — not part of this task's
// backend scope, so it's kept as local-only state on top of the real
// tournament/match records below.
export default function TournamentManagement() {
  const [tournaments, setTournaments] = useState([]);
  const [matchesByTournament, setMatchesByTournament] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teams, setTeams] = useState(6);

  useEffect(() => {
    apiRequest('/admin/tournaments')
      .then((rows) => setTournaments(rows.map((t) => ({ ...t, assignedPlayers: [] }))))
      .catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => { setEditing(null); setName(''); setStartDate(''); setEndDate(''); setTeams(6); setFormOpen(true); };
  const openEdit = (t) => { setEditing(t); setName(t.name); setStartDate(t.startDate); setEndDate(t.endDate); setTeams(t.teams); setFormOpen(true); };

  const save = async () => {
    try {
      if (editing) {
        const updated = await apiRequest(`/admin/tournaments/${editing.id}`, {
          method: 'PUT', body: { name, startDate: startDate || undefined, endDate: endDate || undefined, teams: Number(teams) },
        });
        setTournaments((list) => list.map((t) => (t.id === editing.id ? { ...updated, assignedPlayers: t.assignedPlayers } : t)));
        showToast('Tournament updated.');
      } else {
        const created = await apiRequest('/admin/tournaments', {
          method: 'POST', body: { name, startDate: startDate || undefined, endDate: endDate || undefined, teams: Number(teams) },
        });
        setTournaments((list) => [...list, { ...created, assignedPlayers: [] }]);
        showToast('Tournament created.');
      }
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const togglePlayer = (tournamentId, playerId) => {
    setTournaments((list) => list.map((t) => {
      if (t.id !== tournamentId) return t;
      const has = t.assignedPlayers.includes(playerId);
      return { ...t, assignedPlayers: has ? t.assignedPlayers.filter((id) => id !== playerId) : [...t.assignedPlayers, playerId] };
    }));
  };

  const openDetail = async (t) => {
    setDetailTarget(t);
    try {
      const rows = await apiRequest(`/admin/tournaments/${t.id}/matches`);
      setMatchesByTournament((m) => ({ ...m, [t.id]: rows }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const addMatch = async (tournamentId, { opponent, date, venue }) => {
    try {
      const created = await apiRequest(`/admin/tournaments/${tournamentId}/matches`, {
        method: 'POST', body: { opponent, date, venue },
      });
      setMatchesByTournament((m) => ({ ...m, [tournamentId]: [...(m[tournamentId] || []), created] }));
      showToast('Match added to the tournament.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const recordResult = async (tournamentId, matchId, result) => {
    try {
      const updated = await apiRequest(`/admin/tournaments/matches/${matchId}/result`, {
        method: 'PATCH', body: { result },
      });
      setMatchesByTournament((m) => ({
        ...m,
        [tournamentId]: (m[tournamentId] || []).map((mt) => (mt.id === matchId ? updated : mt)),
      }));
      showToast('Match result saved.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const cancelTournament = async () => {
    try {
      const updated = await apiRequest(`/admin/tournaments/${cancelTarget.id}/cancel`, { method: 'PATCH' });
      setTournaments((list) => list.map((t) => (t.id === cancelTarget.id ? { ...updated, assignedPlayers: t.assignedPlayers } : t)));
      showToast(`${cancelTarget.name} marked Cancelled.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  const deleteTournament = async () => {
    try {
      await apiRequest(`/admin/tournaments/${deleteTarget.id}`, { method: 'DELETE' });
      setTournaments((list) => list.filter((t) => t.id !== deleteTarget.id));
      showToast(`${deleteTarget.name} deleted.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const detail = tournaments.find((t) => t.id === detailTarget?.id);
  const detailMatches = detail ? (matchesByTournament[detail.id] || []) : [];

  return (
    <div className="admin-legacy">
      <Card className="legacy-page-card">
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
                  <button type="button" className="icon-btn" title="Manage Tournament" onClick={() => openDetail(t)}><Icon name="visibility" size={18} /></button>
                  <button type="button" className="icon-btn" title="Edit Tournament" disabled={t.status === 'Cancelled'} onClick={() => openEdit(t)}><Icon name="edit" size={18} /></button>
                  <button type="button" className="icon-btn" title="Cancel Tournament" disabled={t.status === 'Cancelled' || t.status === 'Completed'} onClick={() => setCancelTarget(t)}><Icon name="event_busy" size={18} /></button>
                  <button type="button" className="icon-btn" title="Delete Tournament Permanently" onClick={() => setDeleteTarget(t)}><Icon name="delete" size={18} /></button>
                </div>
              ),
            },
          ]}
        />
      </Card>

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

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelTournament}
        title="Cancel tournament?"
        message={cancelTarget && `${cancelTarget.name} will be marked Cancelled.`}
        tone="danger"
        confirmLabel="Cancel Tournament"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteTournament}
        title="Delete tournament permanently?"
        message={deleteTarget && `${deleteTarget.name} and all of its match history will be permanently removed from the database. This cannot be undone.`}
        tone="danger"
        confirmLabel="Delete"
      />

      {detail && (
        <TournamentDetailModal
          tournament={detail}
          matches={detailMatches}
          onClose={() => setDetailTarget(null)}
          onTogglePlayer={(pid) => togglePlayer(detail.id, pid)}
          onAddMatch={(payload) => addMatch(detail.id, payload)}
          onRecordResult={(matchId, result) => recordResult(detail.id, matchId, result)}
        />
      )}
    </div>
  );
}

function TournamentDetailModal({ tournament, matches, onClose, onTogglePlayer, onAddMatch, onRecordResult }) {
  const [tab, setTab] = useState('players');
  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [resultTarget, setResultTarget] = useState(null);
  const relatedMatches = matches;

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
        New matches start as <strong>Scheduled</strong> — use "Record Result" once the match has been played.
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
        Saving marks this match as <strong>Completed</strong> and updates Tournament History.
      </p>
    </Modal>
  );
}
