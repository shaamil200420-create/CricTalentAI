import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import { PLAYERS, TRAINING_SESSIONS } from '../../data/mockData.js';
import { COACH_RATING_SCALE, PRACTICE_SCORE_MAX, percentOf, formatPercent } from '../../utils/cricket.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = {
  playerId: PLAYERS[0].id, sessionId: TRAINING_SESSIONS[0].id, attendance: 'Present',
  drillsAssigned: '', drillsCompleted: '', battingPractice: '', bowlingPractice: '',
  fieldingScore: '', fitnessScore: '', coachRating: '8', coachNotes: '',
};

export default function TrainingEntry() {
  const [form, setForm] = useState(EMPTY);
  const [entries, setEntries] = useState([]);
  const { showToast } = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isAbsent = form.attendance === 'Absent';
  const drillPct = percentOf(Number(form.drillsCompleted) || 0, Number(form.drillsAssigned) || 0);

  const submit = () => {
    setEntries((list) => [{ ...form, id: `E${list.length + 1}` }, ...list]);
    showToast('Training record saved (demo only — persisted to MySQL Training_Records in Phase 6).');
    setForm(EMPTY);
  };

  return (
    <>
      <PageHeader title="Training Entry" subtitle="Record attendance, drills, practice scores and fitness (FR4)" />

      <Card title="Player & Session">
        <div className="form-grid">
          <FormField label="Player">
            <Select value={form.playerId} onChange={set('playerId')}>
              {PLAYERS.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </Select>
          </FormField>
          <FormField label="Session">
            <Select value={form.sessionId} onChange={set('sessionId')}>
              {TRAINING_SESSIONS.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.date}</option>)}
            </Select>
          </FormField>
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
        <Button variant="primary" icon="save" onClick={submit}>Save Training Record</Button>
      </div>

      {!!entries.length && (
        <Card title="Saved This Session (demo only)" style={{ marginTop: 20 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Session</th><th>Attendance</th><th>Coach Rating</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{PLAYERS.find((p) => p.id === e.playerId)?.name}</td>
                    <td>{TRAINING_SESSIONS.find((s) => s.id === e.sessionId)?.name}</td>
                    <td>{e.attendance}</td>
                    <td>{e.attendance === 'Absent' ? '—' : e.coachRating}</td>
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
