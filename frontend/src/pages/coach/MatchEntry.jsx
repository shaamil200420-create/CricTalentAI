import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import { PLAYERS, MATCHES } from '../../data/mockData.js';
import { boundaryRunsValid, oversNotationToBalls, economyRate, strikeRate, formatNumber } from '../../utils/cricket.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = {
  playerId: PLAYERS[0].id, matchId: MATCHES[0].id,
  runs: '', ballsFaced: '', fours: '', sixes: '', isOut: 'true',
  oversBowled: '', runsConceded: '', wickets: '', maidens: '',
  catches: '', runOuts: '', stumpings: '', notes: '',
};

export default function MatchEntry() {
  const [form, setForm] = useState(EMPTY);
  const [entries, setEntries] = useState([]);
  const { showToast } = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const boundaryOk = boundaryRunsValid(Number(form.runs), Number(form.fours), Number(form.sixes));
  const legalBalls = oversNotationToBalls(form.oversBowled || '0.0');
  const sr = strikeRate(Number(form.runs) || 0, Number(form.ballsFaced) || 0);
  const econ = economyRate(Number(form.runsConceded) || 0, legalBalls);

  const player = PLAYERS.find((p) => p.id === form.playerId);
  const isWicketkeeper = player?.role === 'Wicketkeeper-Batter';

  const submit = () => {
    if (!boundaryOk) {
      showToast('4×fours + 6×sixes cannot exceed total runs. Please fix before saving.');
      return;
    }
    setEntries((list) => [{ ...form, id: `E${list.length + 1}` }, ...list]);
    showToast('Match performance saved (demo only — persisted to MySQL Match_Performance in Phase 6).');
    setForm(EMPTY);
  };

  return (
    <>
      <PageHeader title="Match Entry" subtitle="Record batting, bowling and fielding performance for a single match (FR3)" />

      <Card title="Match & Player">
        <div className="form-grid">
          <FormField label="Player">
            <Select value={form.playerId} onChange={set('playerId')}>
              {PLAYERS.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </Select>
          </FormField>
          <FormField label="Match">
            <Select value={form.matchId} onChange={set('matchId')}>
              {MATCHES.map((m) => <option key={m.id} value={m.id}>{formatMatch(m)}</option>)}
            </Select>
          </FormField>
        </div>
      </Card>

      <Card title="Batting" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Runs"><Input type="number" min="0" value={form.runs} onChange={set('runs')} /></FormField>
          <FormField label="Balls Faced"><Input type="number" min="0" value={form.ballsFaced} onChange={set('ballsFaced')} /></FormField>
          <FormField label="4s"><Input type="number" min="0" value={form.fours} onChange={set('fours')} /></FormField>
          <FormField label="6s"><Input type="number" min="0" value={form.sixes} onChange={set('sixes')} /></FormField>
          <FormField label="Dismissed?">
            <Select value={form.isOut} onChange={set('isOut')}>
              <option value="true">Out</option>
              <option value="false">Not Out</option>
            </Select>
          </FormField>
          <FormField label="Strike Rate" hint="Calculated automatically."><Input disabled value={sr === null ? '—' : formatNumber(sr)} /></FormField>
        </div>
        {!boundaryOk && <p style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4 }}>4×fours + 6×sixes exceeds total runs entered — check the numbers.</p>}
      </Card>

      <Card title="Bowling" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Overs Bowled" hint="Cricket notation, e.g. 3.5 = 3 overs + 5 legal balls."><Input placeholder="e.g. 4.0" value={form.oversBowled} onChange={set('oversBowled')} /></FormField>
          <FormField label="Runs Conceded"><Input type="number" min="0" value={form.runsConceded} onChange={set('runsConceded')} /></FormField>
          <FormField label="Wickets"><Input type="number" min="0" value={form.wickets} onChange={set('wickets')} /></FormField>
          <FormField label="Maidens"><Input type="number" min="0" value={form.maidens} onChange={set('maidens')} /></FormField>
          <FormField label="Economy" hint="Calculated automatically."><Input disabled value={econ === null ? '—' : formatNumber(econ)} /></FormField>
        </div>
      </Card>

      <Card title="Fielding" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Catches"><Input type="number" min="0" value={form.catches} onChange={set('catches')} /></FormField>
          <FormField label="Run Outs"><Input type="number" min="0" value={form.runOuts} onChange={set('runOuts')} /></FormField>
          {isWicketkeeper && <FormField label="Stumpings"><Input type="number" min="0" value={form.stumpings} onChange={set('stumpings')} /></FormField>}
        </div>
        <FormField label="Notes" full><Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional match notes…" /></FormField>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Button variant="primary" icon="save" onClick={submit}>Save Match Performance</Button>
      </div>

      {!!entries.length && (
        <Card title="Saved This Session (demo only)" style={{ marginTop: 20 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Match</th><th>Runs</th><th>Wickets</th><th>Catches</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{PLAYERS.find((p) => p.id === e.playerId)?.name}</td>
                    <td>{MATCHES.find((m) => m.id === e.matchId)?.opponent}</td>
                    <td>{e.runs || 0}</td>
                    <td>{e.wickets || 0}</td>
                    <td>{e.catches || 0}</td>
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

function formatMatch(m) {
  return `${m.opponent} — ${m.date}`;
}
