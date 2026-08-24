import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import { COACH_RATING_SCALE, PRACTICE_SCORE_MAX, percentOf, formatPercent } from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

function buildEmptyForm(playerId, sessionId) {
  return {
    playerId: playerId || '', sessionId: sessionId || '', attendance: 'Present',
    drillsAssigned: '', drillsCompleted: '', battingPractice: '', bowlingPractice: '',
    fieldingScore: '', fitnessScore: '', coachRating: '8', coachNotes: '',
  };
}

// Coach -> Training Entry creates a NEW real Training Record for an
// existing player + an existing training session, persisted straight to
// MySQL (POST /training-records) — no temporary React-state-only "saved
// this session" table anymore; the table below now shows the REAL
// persisted records for the selected session.
//
// Both dropdowns are real, database-backed data, never mock lists:
//   - Player: GET /players?status=Active — the exact same shared Player
//     Directory Match Entry uses, never a separate player array.
//   - Session: GET /schedules (already server-filtered to Training-type
//     schedules only) — the same shared Training Schedule Admin/Coach
//     Schedule Management manage. Selecting a session auto-fills its
//     ID/type/date/time/venue; the Coach never recreates the schedule here.
export default function TrainingEntry() {
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(() => buildEmptyForm());
  const [sessionRecords, setSessionRecords] = useState([]);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest('/players?status=Active')
      .then((list) => {
        setPlayers(list);
        setForm((f) => (f.playerId ? f : { ...f, playerId: list[0]?.id || '' }));
      })
      .catch((err) => showToast(err.message, 'error'));

    // Cancelled sessions aren't eligible for a new attendance/training entry.
    apiRequest('/schedules')
      .then((list) => {
        const eligible = list.filter((s) => s.status !== 'Cancelled');
        setSessions(eligible);
        setForm((f) => (f.sessionId ? f : { ...f, sessionId: eligible[0]?.id || '' }));
      })
      .catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSessionRecords = (sessionId) => {
    if (!sessionId) { setSessionRecords([]); return; }
    apiRequest(`/training-records/session/${sessionId}`).then(setSessionRecords).catch((err) => showToast(err.message, 'error'));
  };

  useEffect(() => {
    loadSessionRecords(form.sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sessionId]);

  const player = players.find((p) => p.id === form.playerId);
  const session = sessions.find((s) => s.id === form.sessionId);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isAbsent = form.attendance === 'Absent';
  const drillPct = percentOf(Number(form.drillsCompleted) || 0, Number(form.drillsAssigned) || 0);

  const submit = async () => {
    setSaving(true);
    try {
      await apiRequest('/training-records', {
        method: 'POST',
        body: {
          playerId: form.playerId, sessionId: form.sessionId, attendance: form.attendance,
          drillsAssigned: form.drillsAssigned, drillsCompleted: form.drillsCompleted,
          battingPractice: form.battingPractice, bowlingPractice: form.bowlingPractice,
          fieldingScore: form.fieldingScore, fitnessScore: form.fitnessScore,
          coachRating: form.coachRating, notes: form.coachNotes,
        },
      });
      showToast('Training record saved.');
      setForm((f) => buildEmptyForm(f.playerId, f.sessionId));
      loadSessionRecords(form.sessionId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Training Entry" subtitle="Record attendance, drills, practice scores and fitness (FR4)" />

      <Card title="Player & Session">
        <div className="form-grid">
          <FormField label="Player" hint="Active players from the database only.">
            <Select value={form.playerId} onChange={set('playerId')}>
              {!players.length && <option value="">Loading players…</option>}
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </Select>
          </FormField>
          <FormField label="Player ID" hint="Auto-filled from the saved player profile."><Input disabled value={player?.id ?? ''} /></FormField>
          <FormField label="Name" hint="Auto-filled from the saved player profile."><Input disabled value={player?.name ?? ''} /></FormField>
          <FormField label="Age" hint="Auto-filled from the saved player profile."><Input disabled value={player?.age ?? ''} /></FormField>
          <FormField label="Role" hint="Auto-filled from the saved player profile."><Input disabled value={player?.role ?? ''} /></FormField>
          <FormField label="Batting Style" hint="Auto-filled from the saved player profile."><Input disabled value={player?.battingStyle ?? ''} /></FormField>
          <FormField label="Bowling Style" hint="Auto-filled from the saved player profile."><Input disabled value={player?.bowlingStyle ?? ''} /></FormField>

          <FormField label="Session" hint="Existing training schedules only.">
            <Select value={form.sessionId} onChange={set('sessionId')}>
              {!sessions.length && <option value="">Loading sessions…</option>}
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.title} — {formatDate(s.date)}</option>)}
            </Select>
          </FormField>
          <FormField label="Session ID" hint="Auto-filled from the selected session."><Input disabled value={session?.id ?? ''} /></FormField>
          <FormField label="Training Type" hint="Auto-filled from the selected session."><Input disabled value={session?.trainingType ?? ''} /></FormField>
          <FormField label="Date" hint="Auto-filled from the selected session."><Input disabled value={session ? formatDate(session.date) : ''} /></FormField>
          <FormField label="Time" hint="Auto-filled from the selected session."><Input disabled value={session?.time ?? ''} /></FormField>
          <FormField label="Venue" hint="Auto-filled from the selected session."><Input disabled value={session?.venue ?? ''} /></FormField>

          <FormField label="Attendance">
            <Select value={form.attendance} onChange={set('attendance')}>
              <option>Present</option>
              <option>Absent</option>
            </Select>
          </FormField>
        </div>
      </Card>

      <Card title="Drills" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Drills Assigned"><Input type="number" min="0" disabled={isAbsent} value={form.drillsAssigned} onChange={set('drillsAssigned')} /></FormField>
          <FormField label="Drills Completed"><Input type="number" min="0" disabled={isAbsent} value={form.drillsCompleted} onChange={set('drillsCompleted')} /></FormField>
          <FormField label="Completion" hint="Calculated automatically."><Input disabled value={drillPct === null ? '—' : formatPercent(drillPct)} /></FormField>
        </div>
      </Card>

      <Card title={`Practice Scores (0–${PRACTICE_SCORE_MAX})`} style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Batting Practice"><Input type="number" min="0" max={PRACTICE_SCORE_MAX} disabled={isAbsent} value={form.battingPractice} onChange={set('battingPractice')} /></FormField>
          <FormField label="Bowling Practice"><Input type="number" min="0" max={PRACTICE_SCORE_MAX} disabled={isAbsent} value={form.bowlingPractice} onChange={set('bowlingPractice')} /></FormField>
          <FormField label="Fielding Score"><Input type="number" min="0" max={PRACTICE_SCORE_MAX} disabled={isAbsent} value={form.fieldingScore} onChange={set('fieldingScore')} /></FormField>
          <FormField label="Fitness Score"><Input type="number" min="0" max={PRACTICE_SCORE_MAX} disabled={isAbsent} value={form.fitnessScore} onChange={set('fitnessScore')} /></FormField>
        </div>
      </Card>

      <Card title="Coach Rating & Notes" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Coach Rating (1–10)">
            <Select value={form.coachRating} disabled={isAbsent} onChange={set('coachRating')}>
              {COACH_RATING_SCALE.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Notes" full><Textarea rows={2} value={form.coachNotes} onChange={set('coachNotes')} placeholder="Observations from this session…" /></FormField>
        </div>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Button variant="primary" icon="save" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save Training Record'}</Button>
      </div>

      {!!sessionRecords.length && (
        <Card title="Recorded For This Session" style={{ marginTop: 20 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Attendance</th><th>Coach Rating</th></tr></thead>
              <tbody>
                {sessionRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{players.find((p) => p.id === r.playerId)?.name ?? r.playerId}</td>
                    <td>{r.attendance}</td>
                    <td>{r.attendance === 'Absent' ? '—' : (r.coachRating ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
