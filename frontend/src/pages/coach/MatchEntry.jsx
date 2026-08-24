import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import {
  oversNotationToBalls, economyRate, strikeRate, fieldingScore, formatNumber,
} from '../../utils/cricket.js';
import { validateMatchPerformance } from '../../utils/matchPerformanceValidation.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

const DISMISSAL_TYPES = ['Caught', 'Bowled', 'LBW', 'Run Out', 'Stumped', 'Not Out', 'Did Not Bat'];

function buildEmptyForm(playerId, matchId) {
  return {
    playerId: playerId || '', matchId: matchId || '',
    battingPosition: '', runs: 0, ballsFaced: 0, dismissalType: 'Not Out', fours: 0, sixes: 0,
    oversBowled: '', runsConceded: 0, wickets: 0, maidens: 0, dotBalls: 0, wides: 0, noBalls: 0,
    catches: 0, droppedCatches: 0, runOuts: 0, stumpings: 0, misfields: 0, notes: '',
  };
}

// Coach -> Match Entry creates a NEW real Match Performance record for an
// existing player + an existing match, persisted straight to MySQL
// (POST /match-performance) — no browser localStorage involved anymore.
// It shares that data — and this page's validation rules — with
// Coach -> Match Records (view/edit/remove) via the same API, so a record
// created here immediately shows up there, survives a page refresh, and
// survives a FastAPI restart.
//
// Both dropdowns are real, database-backed data, never a hard-coded mock
// list:
//   - Player: GET /players?status=Active (the same users + player_profiles
//     JOIN Admin Player Management reads) — selecting a player auto-fills
//     their saved ID/name/age/role/batting/bowling style.
//   - Match: GET /matches (the same shared Match Schedule Admin/Coach
//     Schedule Management manage) — selecting a match auto-fills its
//     ID/date/opponent/tournament/venue/format. The Coach can only pick
//     from EXISTING matches here; there is no way to create an unrelated
//     fixture inside this page.
export default function MatchEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(() => buildEmptyForm(location.state?.playerId));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/players?status=Active')
      .then((list) => {
        setPlayers(list);
        setForm((f) => (f.playerId ? f : { ...f, playerId: list[0]?.id || '' }));
      })
      .catch((err) => showToast(err.message, 'error'));

    // Cancelled matches aren't eligible for a new performance entry — a
    // Scheduled or Completed match still is (a Coach may log performance
    // shortly after full-time, before Admin flips its status).
    apiRequest('/matches')
      .then((list) => {
        const eligible = list.filter((m) => m.status !== 'Cancelled');
        setMatches(eligible);
        setForm((f) => (f.matchId ? f : { ...f, matchId: eligible[0]?.id || '' }));
      })
      .catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const setPlayer = (e) => {
    const playerId = e.target.value;
    const role = players.find((p) => p.id === playerId)?.role;
    setForm((f) => ({ ...f, playerId, ...(role !== 'Wicketkeeper-Batter' ? { stumpings: 0 } : {}) }));
  };

  const setDismissal = (e) => {
    const dismissalType = e.target.value;
    setForm((f) => ({
      ...f,
      dismissalType,
      ...(dismissalType === 'Did Not Bat' ? { battingPosition: '', runs: 0, ballsFaced: 0, fours: 0, sixes: 0 } : {}),
    }));
  };

  // Overs Bowled blank = Did Not Bowl (mirrors the existing Did Not Bat
  // pattern above) — clearing it also clears the bowling figures so the
  // form can never show a contradictory "Did Not Bowl" + "Wickets = 10"
  // combination; the backend already nulls these out regardless (see
  // _recompute_and_validate in routers/match_performance.py), this just
  // keeps the UI honest about it before Save is even clicked.
  const setOvers = (e) => {
    const oversBowled = e.target.value;
    const didNotBowl = oversBowled.trim() === '';
    setForm((f) => ({
      ...f,
      oversBowled,
      ...(didNotBowl ? { runsConceded: 0, wickets: 0, maidens: 0, dotBalls: 0, wides: 0, noBalls: 0 } : {}),
    }));
  };

  const player = players.find((p) => p.id === form.playerId);
  const match = matches.find((m) => m.id === form.matchId);
  const isWicketkeeper = player?.role === 'Wicketkeeper-Batter';
  const didNotBat = form.dismissalType === 'Did Not Bat';
  const didNotBowl = !form.oversBowled || form.oversBowled.trim() === '';

  const legalBalls = oversNotationToBalls(form.oversBowled || '0.0');
  const sr = strikeRate(Number(form.runs) || 0, Number(form.ballsFaced) || 0);
  const boundaryRuns = 4 * (Number(form.fours) || 0) + 6 * (Number(form.sixes) || 0);
  const econ = economyRate(Number(form.runsConceded) || 0, legalBalls);
  // Fielding Score is always derived from Catches / Run Outs / Stumpings —
  // the Coach never types it (see utils/cricket.js: fieldingScore()). The
  // backend recomputes this same figure server-side too — never trusts it.
  const fieldScore = fieldingScore(form.catches, form.runOuts, form.stumpings);

  const submit = async () => {
    const errs = validateMatchPerformance(form, { playerRole: player?.role });
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast(errs.boundary || errs.oversBowled || 'Please fix the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/match-performance', { method: 'POST', body: form });
      showToast('Match performance saved.');
      setForm(buildEmptyForm(form.playerId, form.matchId));
      setErrors({});
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const viewRecords = () => navigate('/coach/match-records', { state: { playerId: form.playerId } });

  return (
    <>
      <PageHeader title="Match Entry" subtitle="Record a player's performance for a completed T20 match (FR3)" />

      <Card title="Player & Match Information">
        <div className="form-grid">
          <FormField label="Player" error={errors.playerId} hint="Active players from the database only.">
            <Select value={form.playerId} onChange={setPlayer}>
              {!players.length && <option value="">Loading players…</option>}
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </Select>
          </FormField>
          <FormField label="Player ID" hint="Auto-filled from the saved player profile."><Input disabled value={player?.id ?? ''} /></FormField>
          <FormField label="Name" hint="Auto-filled from the saved player profile."><Input disabled value={player?.name ?? ''} /></FormField>
          <FormField label="Age" hint="Auto-filled from the saved player profile."><Input disabled value={player?.age ?? ''} /></FormField>
          <FormField label="Primary Role" hint="Auto-filled from the saved player profile."><Input disabled value={player?.role ?? ''} /></FormField>
          <FormField label="Batting Style" hint="Auto-filled from the saved player profile."><Input disabled value={player?.battingStyle ?? ''} /></FormField>
          <FormField label="Bowling Style" hint="Auto-filled from the saved player profile."><Input disabled value={player?.bowlingStyle ?? ''} /></FormField>

          <FormField label="Match" error={errors.matchId} hint="Existing scheduled/completed matches only.">
            <Select value={form.matchId} onChange={set('matchId')}>
              {!matches.length && <option value="">Loading matches…</option>}
              {matches.map((m) => <option key={m.id} value={m.id}>{m.opponent} — {formatDate(m.date)}</option>)}
            </Select>
          </FormField>
          <FormField label="Match ID" hint="Auto-filled from the selected match."><Input disabled value={match?.id ?? ''} /></FormField>
          <FormField label="Match Date" hint="Auto-filled from the selected match."><Input disabled value={match ? formatDate(match.date) : ''} /></FormField>
          <FormField label="Format" hint="T20 only."><Input disabled value={match?.format ?? 'T20'} /></FormField>
          <FormField label="Opponent" hint="Auto-filled from the selected match."><Input disabled value={match?.opponent ?? ''} /></FormField>
          <FormField label="Tournament" hint="Auto-filled from the selected match."><Input disabled value={match?.tournament ?? 'Friendly / None'} /></FormField>
          <FormField label="Venue" hint="Auto-filled from the selected match."><Input disabled value={match?.venue ?? ''} /></FormField>
        </div>
      </Card>

      <Card title="Batting Performance" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Batting Position" error={errors.battingPosition} hint="1–11"><Input type="number" min="1" max="11" disabled={didNotBat} value={form.battingPosition} onChange={set('battingPosition')} /></FormField>
          <FormField label="Runs" error={errors.runs} hint="0–300"><Input type="number" min="0" max="300" disabled={didNotBat} value={form.runs} onChange={set('runs')} /></FormField>
          <FormField label="Balls Faced" error={errors.ballsFaced} hint="0–150"><Input type="number" min="0" max="150" disabled={didNotBat} value={form.ballsFaced} onChange={set('ballsFaced')} /></FormField>
          <FormField label="Dismissal Type">
            <Select value={form.dismissalType} onChange={setDismissal}>
              {DISMISSAL_TYPES.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </FormField>
          <FormField label="Fours" error={errors.fours}><Input type="number" min="0" disabled={didNotBat} value={form.fours} onChange={set('fours')} /></FormField>
          <FormField label="Sixes" error={errors.sixes}><Input type="number" min="0" disabled={didNotBat} value={form.sixes} onChange={set('sixes')} /></FormField>
          <FormField label="Strike Rate" hint="Calculated automatically."><Input disabled value={sr === null ? '—' : formatNumber(sr)} /></FormField>
          <FormField label="Boundary Runs" hint="Calculated automatically — (4 × fours) + (6 × sixes)." error={errors.boundary}><Input disabled value={boundaryRuns} /></FormField>
        </div>
      </Card>

      <Card title="Bowling Performance" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Overs Bowled" hint="Cricket notation, e.g. 3.5 = 3 overs + 5 legal balls. Leave blank if the player did not bowl." error={errors.oversBowled}>
            <Input placeholder="e.g. 4.0" value={form.oversBowled} onChange={setOvers} />
          </FormField>
          <FormField label="Runs Conceded" error={errors.runsConceded} hint="0–150"><Input type="number" min="0" max="150" disabled={didNotBowl} value={form.runsConceded} onChange={set('runsConceded')} /></FormField>
          <FormField label="Wickets" error={errors.wickets}><Input type="number" min="0" max="10" disabled={didNotBowl} value={form.wickets} onChange={set('wickets')} /></FormField>
          <FormField label="Maidens" error={errors.maidens} hint="Max = completed overs bowled (safety cap 4).">
            <Input type="number" min="0" max="4" disabled={didNotBowl} value={form.maidens} onChange={set('maidens')} />
          </FormField>
          <FormField label="Dot Balls" error={errors.dotBalls} hint="Max = legal balls bowled (safety cap 24).">
            <Input type="number" min="0" max="24" disabled={didNotBowl} value={form.dotBalls} onChange={set('dotBalls')} />
          </FormField>
          <FormField label="Wides" error={errors.wides} hint="0–30"><Input type="number" min="0" max="30" disabled={didNotBowl} value={form.wides} onChange={set('wides')} /></FormField>
          <FormField label="No-balls" error={errors.noBalls} hint="0–30"><Input type="number" min="0" max="30" disabled={didNotBowl} value={form.noBalls} onChange={set('noBalls')} /></FormField>
          <FormField label="Economy Rate" hint="Calculated automatically from legal balls bowled.">
            <Input disabled value={legalBalls === 0 ? '—' : (econ === null ? '—' : formatNumber(econ))} />
          </FormField>
        </div>
      </Card>

      <Card title="Fielding Performance" style={{ marginTop: 16 }}>
        <div className="form-grid">
          <FormField label="Catches" error={errors.catches} hint="0–10"><Input type="number" min="0" max="10" value={form.catches} onChange={set('catches')} /></FormField>
          <FormField label="Dropped Catches" hint="Match context only. 0–15" error={errors.droppedCatches}><Input type="number" min="0" max="15" value={form.droppedCatches} onChange={set('droppedCatches')} /></FormField>
          <FormField label="Run Outs" error={errors.runOuts} hint="0–10"><Input type="number" min="0" max="10" value={form.runOuts} onChange={set('runOuts')} /></FormField>
          {isWicketkeeper && <FormField label="Stumpings" error={errors.stumpings} hint="0–10"><Input type="number" min="0" max="10" value={form.stumpings} onChange={set('stumpings')} /></FormField>}
          <FormField label="Misfields" hint="Match context only. 0–20" error={errors.misfields}><Input type="number" min="0" max="20" value={form.misfields} onChange={set('misfields')} /></FormField>
          <FormField label="Fielding Score" hint="Calculated automatically from Catches, Run Outs and Stumpings."><Input disabled value={fieldScore} /></FormField>
        </div>
        <FormField label="Notes" full><Textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional match notes…" /></FormField>
      </Card>

      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" icon="save" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save Match Performance'}</Button>
        <Button variant="secondary" icon="list_alt" onClick={viewRecords}>View Match Records</Button>
      </div>
    </>
  );
}
