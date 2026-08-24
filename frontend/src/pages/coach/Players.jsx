import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge, Badge } from '../../components/Badge.jsx';
import { PersonRow } from '../../components/InitialAvatar.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Tabs from '../../components/Tabs.jsx';
import ChartContainer from '../../components/ChartContainer.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import { PLAYER_ROLES, formatNumber } from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

const TREND_METRICS = [
  { value: 'runs', label: 'Runs' },
  { value: 'strikeRate', label: 'Strike Rate' },
  { value: 'wickets', label: 'Wickets' },
  { value: 'economy', label: 'Economy' },
  { value: 'attendance', label: 'Attendance' },
];

// FR2 (Coach side) — Coach can Add / View / Edit / Activate-Deactivate a
// player's CRICKET PROFILE only (name, age, role, batting/bowling style,
// height, weight, status). This intentionally reuses the same
// profile-management pattern as Admin -> Player Management, but WITHOUT any
// of Admin's login/account fields (no username, no password, no password
// reset) — account/login credentials stay an Admin-only responsibility.
//
// The player list itself is now the SAME real database players Admin ->
// Player Management manages (GET /players — the shared, read-only Player
// Directory backed by the users + player_profiles JOIN), never a
// hard-coded mock list, so Coach always sees the same roster Admin does.
export default function CoachPlayers() {
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [viewTarget, setViewTarget] = useState(null);
  const [modalPlayer, setModalPlayer] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest('/players').then(setPlayers).catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => players.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesQuery && matchesRole;
  }), [players, query, roleFilter]);

  const save = (form) => {
    if (modalPlayer?.id) {
      setPlayers((list) => list.map((p) => (p.id === modalPlayer.id ? { ...p, ...form } : p)));
      showToast('Player profile updated (demo only).');
    } else {
      const id = `P${String(players.length + 1).padStart(3, '0')}`;
      setPlayers((list) => [...list, { id, status: 'Active', coach: 'Ravi Jayasinghe', ...form }]);
      showToast('Player profile created (demo only — login account is set up by Admin).');
    }
    setModalPlayer(null);
  };

  const toggleStatus = (p) => {
    setPlayers((list) => list.map((x) => (x.id === p.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x)));
    showToast(`${p.name} marked ${p.status === 'Active' ? 'Inactive' : 'Active'} (demo only).`);
    setConfirmTarget(null);
  };

  return (
    <>
      <PageHeader
        title="Player List"
        subtitle="Your assigned squad — profile, stats and feedback in one view"
        actions={<Button icon="person_add" onClick={() => setModalPlayer({})}>Add Player Profile</Button>}
      />

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
          { key: 'name', header: 'Name', render: (p) => <PersonRow name={p.name} /> },
          { key: 'age', header: 'Age' },
          { key: 'role', header: 'Role' },
          { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          {
            key: 'actions', header: '',
            render: (p) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button type="button" className="icon-btn" title="View Player Profile" onClick={() => setViewTarget(p)}><Icon name="visibility" size={18} /></button>
                <button type="button" className="icon-btn" title="Edit Player Profile" onClick={() => setModalPlayer(p)}><Icon name="edit" size={18} /></button>
                <button type="button" className="icon-btn" title={p.status === 'Active' ? 'Deactivate Player Profile' : 'Activate Player Profile'} onClick={() => setConfirmTarget(p)}>
                  <Icon name={p.status === 'Active' ? 'person_off' : 'check_circle'} size={18} />
                </button>
              </div>
            ),
          },
        ]}
      />

      {viewTarget && <PlayerDetailModal player={viewTarget} onClose={() => setViewTarget(null)} />}

      <PlayerProfileFormModal open={!!modalPlayer} initial={modalPlayer} onClose={() => setModalPlayer(null)} onSave={save} />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => toggleStatus(confirmTarget)}
        title={confirmTarget?.status === 'Active' ? 'Deactivate player profile?' : 'Activate player profile?'}
        message={confirmTarget && `${confirmTarget.name} will be marked ${confirmTarget.status === 'Active' ? 'Inactive' : 'Active'} (demo only). This does not change their login account.`}
        confirmLabel={confirmTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        tone={confirmTarget?.status === 'Active' ? 'danger' : 'primary'}
      />
    </>
  );
}

// Cricket-profile fields ONLY — no username/password/login fields here.
// Managing a player's login account/credentials stays with Admin ->
// Player Management; this modal only ever touches profile data.
function PlayerProfileFormModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || '', age: initial?.age || '', role: initial?.role || PLAYER_ROLES[0],
        battingStyle: initial?.battingStyle || '', bowlingStyle: initial?.bowlingStyle || '',
        heightCm: initial?.heightCm || '', weightKg: initial?.weightKg || '', status: initial?.status || 'Active',
      });
      setErrors({});
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isEdit = !!initial?.id;

  const submit = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Player name is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Player Profile' : 'Add Player Profile'}
      subtitle={isEdit ? undefined : "Creates the player's cricket profile — their login account is set up separately by Admin."}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={submit}>{isEdit ? 'Save Changes' : 'Save Player'}</Button>
      </>}
    >
      <div className="form-grid">
        {isEdit && <FormField label="Player ID"><Input value={initial.id} disabled readOnly /></FormField>}
        <FormField label="Player Name" full={!isEdit} error={errors.name}><Input value={form.name} onChange={set('name')} placeholder="e.g. Nuwan Silva" /></FormField>
        <FormField label="Age"><Input type="number" min="12" max="19" value={form.age} onChange={set('age')} /></FormField>
        <FormField label="Role">
          <Select value={form.role} onChange={set('role')}>
            {PLAYER_ROLES.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </FormField>
        <FormField label="Batting Style"><Input value={form.battingStyle} onChange={set('battingStyle')} placeholder="e.g. Right-hand bat" /></FormField>
        <FormField label="Bowling Style"><Input value={form.bowlingStyle} onChange={set('bowlingStyle')} placeholder="e.g. Right-arm fast" /></FormField>
        <FormField label="Height (cm)"><Input type="number" value={form.heightCm} onChange={set('heightCm')} /></FormField>
        <FormField label="Weight (kg)"><Input type="number" value={form.weightKg} onChange={set('weightKg')} /></FormField>
        {isEdit && (
          <FormField label="Status">
            <Select value={form.status} onChange={set('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </FormField>
        )}
      </div>
      <p className="text-faint" style={{ fontSize: 11.5, marginTop: 4, marginBottom: 0 }}>
        Profile information only — no login/account or password fields. Height and weight are never used as AI/ML prediction features.
      </p>
    </Modal>
  );
}

function PlayerDetailModal({ player, onClose }) {
  const [tab, setTab] = useState('overview');
  // Coach Feedback now persists to the real player_feedback MySQL table
  // (GET/POST /feedback) — Player -> My Feedback reads these same rows.
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [note, setNote] = useState({ text: '', strengths: '', areasToImprove: '', visibility: 'PLAYER_VISIBLE' });
  const [savingFeedback, setSavingFeedback] = useState(false);
  const { showToast } = useToast();

  const loadFeedback = () => {
    setFeedbackLoading(true);
    apiRequest(`/feedback/player/${player.id}`)
      .then(setFeedback)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setFeedbackLoading(false));
  };

  useEffect(loadFeedback, [player.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Match Stats / Performance Trends read the SAME real MySQL records
  // Match Entry, Match Records, Training Entry and Player My Match
  // Stats/My Training Records use (GET /match-performance/player/{id},
  // /training-records/player/{id}, /matches, /schedules) — never mock data.
  const [loading, setLoading] = useState(true);
  const [innings, setInnings] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [matches, setMatches] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiRequest(`/match-performance/player/${player.id}`),
      apiRequest(`/training-records/player/${player.id}`),
      apiRequest('/matches'),
      apiRequest('/schedules'),
    ])
      .then(([mp, tr, m, s]) => {
        if (cancelled) return;
        setInnings(mp);
        setTrainingRecords(tr);
        setMatches(m);
        setSchedules(s);
      })
      .catch((err) => { if (!cancelled) showToast(err.message, 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.id]);

  const addFeedback = async () => {
    if (!note.text.trim()) return;
    setSavingFeedback(true);
    try {
      await apiRequest('/feedback', {
        method: 'POST',
        body: { playerId: player.id, text: note.text, strengths: note.strengths, areasToImprove: note.areasToImprove, visibility: note.visibility },
      });
      showToast('Feedback saved.');
      setNote({ text: '', strengths: '', areasToImprove: '', visibility: 'PLAYER_VISIBLE' });
      loadFeedback();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={player.name} subtitle={`${player.id} · ${player.role}`} wide footer={<Button variant="primary" onClick={onClose}>Close</Button>}>
      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'stats', label: 'Match Stats' },
          { value: 'trends', label: 'Performance Trends' },
          { value: 'feedback', label: 'Coach Feedback' },
        ]}
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
        loading ? (
          <p className="text-faint" style={{ fontSize: 13 }}>Loading match performance…</p>
        ) : innings.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Match</th><th>Runs</th><th>Balls</th><th>SR</th><th>4s</th><th>6s</th></tr></thead>
              <tbody>
                {innings.map((m) => {
                  const match = matches.find((x) => x.id === m.matchId);
                  const notOut = m.dismissalType === 'Not Out';
                  return (
                    <tr key={m.id}>
                      <td>{match ? `${formatDate(match.date)} vs ${match.opponent}` : m.matchId}</td>
                      <td>{m.runs != null ? `${m.runs}${notOut ? '*' : ''}` : '—'}</td>
                      <td>{m.ballsFaced ?? '—'}</td>
                      <td>{m.strikeRate != null ? formatNumber(m.strikeRate) : '—'}</td>
                      <td>{m.fours ?? '—'}</td>
                      <td>{m.sixes ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-faint" style={{ fontSize: 13 }}>No match performance recorded yet for {player.name}.</p>
        )
      )}

      {tab === 'trends' && (
        <PerformanceTrends player={player} loading={loading} innings={innings} trainingRecords={trainingRecords} matches={matches} schedules={schedules} />
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
          <Button variant="primary" icon="add_comment" onClick={addFeedback} disabled={!note.text.trim() || savingFeedback}>{savingFeedback ? 'Saving…' : 'Add Feedback'}</Button>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {feedbackLoading ? (
              <p className="text-faint" style={{ fontSize: 13 }}>Loading feedback…</p>
            ) : (
              <>
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
              </>
            )}
          </ul>
        </div>
      )}
    </Modal>
  );
}

// FR10 — one reusable Performance Trends section for the Coach, covering
// Runs / Strike Rate / Wickets / Economy / Attendance behind a single
// metric selector, instead of five separate dashboards. A metric that
// doesn't apply to the selected player's role (or has no recorded data)
// shows a clear "Not applicable" state rather than fabricated numbers.
function PerformanceTrends({ player, loading, innings, trainingRecords, matches, schedules }) {
  const [metric, setMetric] = useState('runs');

  const canBat = innings?.some((m) => m.runs != null);
  const canBowl = innings?.some((m) => m.wickets != null);

  const applicability = {
    runs: canBat,
    strikeRate: canBat,
    wickets: canBowl,
    economy: canBowl,
    attendance: !!trainingRecords?.length,
  };

  const isApplicable = !loading && applicability[metric];

  const matchChartData = innings?.map((m) => {
    const match = matches.find((x) => x.id === m.matchId);
    return {
      name: match ? formatDate(match.date) : m.matchId,
      runs: m.runs,
      strikeRate: m.strikeRate ?? 0,
      wickets: m.wickets,
      economy: m.economyRate ?? 0,
    };
  }) ?? [];

  const attendanceChartData = trainingRecords?.map((r) => {
    const session = schedules.find((s) => s.id === r.sessionId);
    return { name: session ? formatDate(session.date) : r.sessionId, attendance: r.attendance === 'Present' ? 1 : 0, label: r.attendance };
  }) ?? [];

  const METRIC_CONFIG = {
    runs: { dataKey: 'runs', label: 'Runs', color: 'var(--color-primary)', integer: true },
    strikeRate: { dataKey: 'strikeRate', label: 'Strike Rate', color: 'var(--color-cyan)' },
    wickets: { dataKey: 'wickets', label: 'Wickets', color: 'var(--color-primary)', integer: true },
    economy: { dataKey: 'economy', label: 'Economy', color: 'var(--color-cyan)' },
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {TREND_METRICS.map((m) => (
          <Button key={m.value} size="sm" variant={metric === m.value ? 'primary' : 'secondary'} onClick={() => setMetric(m.value)}>
            {m.label}
          </Button>
        ))}
      </div>

      {!isApplicable ? (
        <Card>
          <EmptyState
            icon="block"
            title="Not applicable"
            hint={
              metric === 'attendance'
                ? `No training/attendance records are recorded yet for ${player.name}.`
                : `${TREND_METRICS.find((m) => m.value === metric)?.label} does not apply to ${player.name}'s role (${player.role}), or no match performance is recorded for this player yet.`
            }
          />
        </Card>
      ) : metric === 'attendance' ? (
        <ChartContainer title="Attendance Trend" sub="Present (1) vs Absent (0) per session (FR10)" height={260}>
          <ResponsiveContainer>
            <BarChart data={attendanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(value, name, props) => [props.payload.label, 'Attendance']}
              />
              <Bar dataKey="attendance" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <ChartContainer title={`${METRIC_CONFIG[metric].label} by Match`} sub="Most recent matches (FR10)" height={260}>
          <ResponsiveContainer>
            <LineChart data={matchChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={!METRIC_CONFIG[metric].integer} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey={METRIC_CONFIG[metric].dataKey} stroke={METRIC_CONFIG[metric].color} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
