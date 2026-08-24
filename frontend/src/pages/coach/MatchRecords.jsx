import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { Card, StatCard } from '../../components/Card.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { PersonRow } from '../../components/InitialAvatar.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import DataTable from '../../components/DataTable.jsx';
import { validateMatchPerformance } from '../../utils/matchPerformanceValidation.js';
import {
  oversNotationToBalls, economyRate, strikeRate, fieldingScore, formatNumber,
} from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

const DISMISSAL_TYPES = ['Caught', 'Bowled', 'LBW', 'Run Out', 'Stumped', 'Not Out', 'Did Not Bat'];

// Per-record derived figures (Strike Rate / Economy / Fielding Score) for
// display in the summary table and View modal — never stored server-side
// again here, always computed live from the raw fields, same as Match
// Entry (the backend ALSO computes/stores these same figures itself for
// its own integrity, but this page never needs to trust that value blindly
// since it can always re-derive it from the raw fields it already has).
function deriveRecordMetrics(r) {
  const legalBalls = oversNotationToBalls(r.oversBowled || '0.0');
  return {
    sr: strikeRate(Number(r.runs) || 0, Number(r.ballsFaced) || 0),
    boundaryRuns: 4 * (Number(r.fours) || 0) + 6 * (Number(r.sixes) || 0),
    legalBalls,
    econ: legalBalls > 0 ? economyRate(Number(r.runsConceded) || 0, legalBalls) : null,
    fieldScore: fieldingScore(r.catches, r.runOuts, r.stumpings),
  };
}

// Normalizes a real MatchPerformanceOut record (which uses null for
// "not applicable" — Did Not Bat / did not bowl) into safe, always-defined
// values for a controlled edit form. Purely a display/editing concern —
// the backend is still the one true source for what's actually null.
function toEditableForm(record) {
  return {
    ...record,
    battingPosition: record.battingPosition ?? '',
    runs: record.runs ?? 0,
    ballsFaced: record.ballsFaced ?? 0,
    fours: record.fours ?? 0,
    sixes: record.sixes ?? 0,
    oversBowled: record.oversBowled ?? '',
    runsConceded: record.runsConceded ?? 0,
    wickets: record.wickets ?? 0,
    maidens: record.maidens ?? 0,
    dotBalls: record.dotBalls ?? 0,
    wides: record.wides ?? 0,
    noBalls: record.noBalls ?? 0,
    notes: record.notes ?? '',
  };
}

// Coach -> Match Records: pick ONE player, see ONLY that player's recorded
// match performances (View / Edit / Remove). Reads/writes real MySQL via
// GET/PUT/DELETE /match-performance — the exact same records Match Entry
// creates and Player -> My Match Stats reads, never a second copy.
export default function MatchRecords() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [playerId, setPlayerId] = useState(location.state?.playerId || '');
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);

  // Every player (any status) — a player who became Inactive after having
  // historical records should still be selectable here to view them.
  useEffect(() => {
    apiRequest('/players')
      .then((list) => {
        setPlayers(list);
        setPlayerId((id) => id || list[0]?.id || '');
      })
      .catch((err) => showToast(err.message, 'error'));
    apiRequest('/matches').then(setMatches).catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecords = () => {
    if (!playerId) return;
    apiRequest(`/match-performance/player/${playerId}`)
      .then(setRecords)
      .catch((err) => showToast(err.message, 'error'));
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const player = players.find((p) => p.id === playerId);

  const playerRecords = records
    .map((r) => ({ ...r, match: matches.find((m) => m.id === r.matchId) }))
    .sort((a, b) => (b.match?.date || '').localeCompare(a.match?.date || '')); // newest first

  const filtered = useMemo(() => playerRecords.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesQuery = !q || [r.matchId, r.match?.opponent, r.match?.venue, r.match?.tournament]
      .some((v) => v && String(v).toLowerCase().includes(q));
    const matchesFrom = !fromDate || (r.match?.date && r.match.date >= fromDate);
    const matchesTo = !toDate || (r.match?.date && r.match.date <= toDate);
    return matchesQuery && matchesFrom && matchesTo;
  }), [playerRecords, search, fromDate, toDate]);

  // Summary stats always reflect the selected player's FULL record set —
  // filters only narrow the table below, not these totals.
  const summary = useMemo(() => {
    const totalRuns = playerRecords.reduce((s, r) => s + (Number(r.runs) || 0), 0);
    const totalBalls = playerRecords.reduce((s, r) => s + (Number(r.ballsFaced) || 0), 0);
    const totalWickets = playerRecords.reduce((s, r) => s + (Number(r.wickets) || 0), 0);
    const totalRunsConceded = playerRecords.reduce((s, r) => s + (Number(r.runsConceded) || 0), 0);
    const totalLegalBalls = playerRecords.reduce((s, r) => s + oversNotationToBalls(r.oversBowled || '0.0'), 0);
    return {
      matches: playerRecords.length,
      totalRuns,
      avgStrikeRate: strikeRate(totalRuns, totalBalls),
      totalWickets,
      avgEconomy: totalLegalBalls > 0 ? economyRate(totalRunsConceded, totalLegalBalls) : null,
    };
  }, [playerRecords]);

  const clearFilters = () => { setSearch(''); setFromDate(''); setToDate(''); };
  const addRecordForPlayer = () => navigate('/coach/match-entry', { state: { playerId } });

  const doRemove = async () => {
    const target = removeTarget;
    try {
      await apiRequest(`/match-performance/${target.id}`, { method: 'DELETE' });
      setRecords((list) => list.filter((r) => r.id !== target.id));
      showToast('Match record removed successfully.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRemoveTarget(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Match Records"
        subtitle="View, edit and manage recorded player match performance"
        actions={<Button icon="add" onClick={addRecordForPlayer}>Add Match Record</Button>}
      />

      <Card title="Player" style={{ marginBottom: 16 }}>
        <div className="form-grid" style={{ marginBottom: 14 }}>
          <FormField label="Player">
            <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              {!players.length && <option value="">Loading players…</option>}
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </Select>
          </FormField>
        </div>
        {player && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PersonRow name={player.name} size={44} />
            <span className="text-faint mono" style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              {player.id} · {player.role} · <StatusBadge status={player.status} />
            </span>
          </div>
        )}
      </Card>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Matches Recorded" value={summary.matches} icon={<Icon name="event_note" />} />
        <StatCard label="Total Runs" value={summary.totalRuns} icon={<Icon name="sports_cricket" />} tone="cyan" />
        <StatCard label="Average Strike Rate" value={summary.avgStrikeRate === null ? '—' : formatNumber(summary.avgStrikeRate)} icon={<Icon name="bolt" />} tone="amber" />
        <StatCard label="Total Wickets" value={summary.totalWickets} icon={<Icon name="sports_baseball" />} tone="error" />
        <StatCard label="Average Economy" value={summary.avgEconomy === null ? 'N/A' : formatNumber(summary.avgEconomy)} icon={<Icon name="track_changes" />} />
      </div>

      {playerRecords.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '28px 12px' }}>
            <h3 style={{ margin: '0 0 6px' }}>No Match Records Yet</h3>
            <p className="text-faint" style={{ fontSize: 13, margin: '0 0 16px' }}>
              No match-performance records have been recorded for {player?.name ?? 'this player'}.
            </p>
            <Button icon="add" onClick={addRecordForPlayer}>Add Match Record</Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="table-toolbar">
            <div className="table-search"><Icon name="search" /><Input placeholder="Search match/opponent…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="filter-row" style={{ alignItems: 'flex-end' }}>
              <FormField label="From"><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></FormField>
              <FormField label="To"><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></FormField>
              <Button variant="secondary" size="sm" icon="filter_alt_off" onClick={clearFilters}>Clear</Button>
            </div>
          </div>

          <DataTable
            rows={filtered}
            emptyTitle="No records match these filters"
            columns={[
              {
                key: 'match', header: 'Date / Match',
                render: (r) => (
                  <div>
                    <div>{r.match ? formatDate(r.match.date) : '—'}</div>
                    <div className="text-faint" style={{ fontSize: 11.5 }}>{r.matchId} · vs {r.match?.opponent ?? '—'}</div>
                  </div>
                ),
              },
              { key: 'runs', header: 'Runs', render: (r) => r.dismissalType === 'Did Not Bat' ? '—' : `${r.runs}${r.dismissalType === 'Not Out' ? '*' : ''}` },
              { key: 'ballsFaced', header: 'Balls', render: (r) => r.dismissalType === 'Did Not Bat' ? '—' : r.ballsFaced },
              { key: 'sr', header: 'SR', render: (r) => { const { sr } = deriveRecordMetrics(r); return sr === null ? '—' : formatNumber(sr); } },
              { key: 'fours', header: '4s', render: (r) => r.dismissalType === 'Did Not Bat' ? '—' : r.fours },
              { key: 'sixes', header: '6s', render: (r) => r.dismissalType === 'Did Not Bat' ? '—' : r.sixes },
              { key: 'wickets', header: 'Wickets', render: (r) => (r.oversBowled ? r.wickets : '—') },
              { key: 'econ', header: 'Economy', render: (r) => { const { econ } = deriveRecordMetrics(r); return econ === null ? '—' : formatNumber(econ); } },
              { key: 'catches', header: 'Catches' },
              { key: 'runOuts', header: 'Run Outs' },
              {
                key: 'actions', header: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button type="button" className="icon-btn" title="View Record" onClick={() => setViewTarget(r)}><Icon name="visibility" size={18} /></button>
                    <button type="button" className="icon-btn" title="Edit Record" onClick={() => setEditTarget(r)}><Icon name="edit" size={18} /></button>
                    <button type="button" className="icon-btn" title="Remove Record" onClick={() => setRemoveTarget(r)}><Icon name="delete" size={18} /></button>
                  </div>
                ),
              },
            ]}
          />
        </>
      )}

      <ViewRecordModal
        record={viewTarget}
        player={player}
        onClose={() => setViewTarget(null)}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
      />

      <EditRecordModal
        record={editTarget}
        player={player}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={(updated) => {
          setRecords((list) => list.map((r) => (r.id === updated.id ? updated : r)));
          setEditTarget(null);
          showToast('Match record updated successfully.');
        }}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={doRemove}
        title="Remove Match Record?"
        message={removeTarget && `You are about to remove ${player?.name}'s performance record for ${removeTarget.match ? formatDate(removeTarget.match.date) : ''} vs ${removeTarget.match?.opponent ?? 'this opponent'}. This action removes the performance record only.`}
        confirmLabel="Remove Record"
        tone="danger"
      />
    </>
  );
}

function ViewRecordModal({ record, player, onClose, onEdit }) {
  if (!record) return null;
  const match = record.match;
  const { sr, boundaryRuns, econ, fieldScore } = deriveRecordMetrics(record);
  const didNotBat = record.dismissalType === 'Did Not Bat';
  const bowled = !!record.oversBowled && oversNotationToBalls(record.oversBowled) > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Match Record"
      subtitle={`${player?.name ?? record.playerId} · ${match ? formatDate(match.date) : ''} vs ${match?.opponent ?? '—'}`}
      wide
      footer={<>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button variant="primary" icon="edit" onClick={onEdit}>Edit Record</Button>
      </>}
    >
      <div className="form-section-label">Match Information</div>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <FormField label="Player Name"><Input disabled value={player?.name ?? ''} /></FormField>
        <FormField label="Player ID"><Input disabled value={record.playerId} /></FormField>
        <FormField label="Match ID"><Input disabled value={record.matchId} /></FormField>
        <FormField label="Match Date"><Input disabled value={match ? formatDate(match.date) : '—'} /></FormField>
        <FormField label="Opponent"><Input disabled value={match?.opponent ?? '—'} /></FormField>
        <FormField label="Tournament"><Input disabled value={match?.tournament ?? '—'} /></FormField>
        <FormField label="Venue"><Input disabled value={match?.venue ?? '—'} /></FormField>
        <FormField label="Format"><Input disabled value={match?.format ?? 'T20'} /></FormField>
      </div>

      <div className="form-section-label">Batting</div>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <FormField label="Batting Position"><Input disabled value={didNotBat ? '—' : (record.battingPosition ?? '—')} /></FormField>
        <FormField label="Runs"><Input disabled value={didNotBat ? '—' : record.runs} /></FormField>
        <FormField label="Balls Faced"><Input disabled value={didNotBat ? '—' : record.ballsFaced} /></FormField>
        <FormField label="Strike Rate"><Input disabled value={sr === null ? '—' : formatNumber(sr)} /></FormField>
        <FormField label="Fours"><Input disabled value={didNotBat ? '—' : record.fours} /></FormField>
        <FormField label="Sixes"><Input disabled value={didNotBat ? '—' : record.sixes} /></FormField>
        <FormField label="Boundary Runs"><Input disabled value={didNotBat ? '—' : boundaryRuns} /></FormField>
        <FormField label="Dismissal"><Input disabled value={record.dismissalType} /></FormField>
      </div>

      <div className="form-section-label">Bowling</div>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <FormField label="Overs Bowled"><Input disabled value={bowled ? record.oversBowled : '—'} /></FormField>
        <FormField label="Runs Conceded"><Input disabled value={bowled ? record.runsConceded : '—'} /></FormField>
        <FormField label="Wickets"><Input disabled value={bowled ? record.wickets : '—'} /></FormField>
        <FormField label="Maidens"><Input disabled value={bowled ? record.maidens : '—'} /></FormField>
        <FormField label="Dot Balls"><Input disabled value={bowled ? record.dotBalls : '—'} /></FormField>
        <FormField label="Wides"><Input disabled value={bowled ? record.wides : '—'} /></FormField>
        <FormField label="No-balls"><Input disabled value={bowled ? record.noBalls : '—'} /></FormField>
        <FormField label="Economy Rate"><Input disabled value={!bowled ? '—' : (econ === null ? '—' : formatNumber(econ))} /></FormField>
      </div>

      <div className="form-section-label">Fielding</div>
      <div className="form-grid">
        <FormField label="Catches"><Input disabled value={record.catches} /></FormField>
        <FormField label="Dropped Catches"><Input disabled value={record.droppedCatches} /></FormField>
        <FormField label="Run Outs"><Input disabled value={record.runOuts} /></FormField>
        <FormField label="Stumpings"><Input disabled value={record.stumpings} /></FormField>
        <FormField label="Misfields"><Input disabled value={record.misfields} /></FormField>
        <FormField label="Fielding Score"><Input disabled value={fieldScore} /></FormField>
      </div>

      <div className="form-section-label" style={{ marginTop: 18 }}>Notes</div>
      <p className="text-faint" style={{ fontSize: 13 }}>{record.notes?.trim() ? record.notes : 'No notes recorded.'}</p>
    </Modal>
  );
}

function EditRecordModal({ record, player, open, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open && record) {
      setForm(toEditableForm(record));
      setErrors({});
    }
  }, [open, record]);

  if (!open || !record || !form) return null;

  const match = record.match;
  const isWicketkeeper = player?.role === 'Wicketkeeper-Batter';
  const didNotBat = form.dismissalType === 'Did Not Bat';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const setDismissal = (e) => {
    const dismissalType = e.target.value;
    setForm((f) => ({
      ...f,
      dismissalType,
      ...(dismissalType === 'Did Not Bat' ? { battingPosition: '', runs: 0, ballsFaced: 0, fours: 0, sixes: 0 } : {}),
    }));
  };

  const legalBalls = oversNotationToBalls(form.oversBowled || '0.0');
  const sr = strikeRate(Number(form.runs) || 0, Number(form.ballsFaced) || 0);
  const boundaryRuns = 4 * (Number(form.fours) || 0) + 6 * (Number(form.sixes) || 0);
  const econ = legalBalls > 0 ? economyRate(Number(form.runsConceded) || 0, legalBalls) : null;
  const fieldScore = fieldingScore(form.catches, form.runOuts, form.stumpings);

  const submit = async () => {
    const errs = validateMatchPerformance(form, { playerRole: player?.role });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const updated = await apiRequest(`/match-performance/${record.id}`, {
        method: 'PUT',
        body: {
          battingPosition: form.battingPosition, runs: form.runs, ballsFaced: form.ballsFaced,
          dismissalType: form.dismissalType, fours: form.fours, sixes: form.sixes,
          oversBowled: form.oversBowled, runsConceded: form.runsConceded, wickets: form.wickets,
          maidens: form.maidens, dotBalls: form.dotBalls, wides: form.wides, noBalls: form.noBalls,
          catches: form.catches, droppedCatches: form.droppedCatches, runOuts: form.runOuts,
          stumpings: form.stumpings, misfields: form.misfields, notes: form.notes,
        },
      });
      onSaved(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Match Record"
      subtitle="Player and match cannot be changed here — only the performance values."
      wide
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
      </>}
    >
      <div className="form-section-label">Player & Match (read-only)</div>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <FormField label="Player"><Input disabled value={`${player?.name ?? ''} (${record.playerId})`} /></FormField>
        <FormField label="Match ID"><Input disabled value={record.matchId} /></FormField>
        <FormField label="Match Date"><Input disabled value={match ? formatDate(match.date) : '—'} /></FormField>
        <FormField label="Opponent"><Input disabled value={match?.opponent ?? '—'} /></FormField>
      </div>

      <div className="form-section-label">Batting</div>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <FormField label="Batting Position" hint="1–11"><Input type="number" min="1" max="11" disabled={didNotBat} value={form.battingPosition} onChange={set('battingPosition')} /></FormField>
        <FormField label="Runs" error={errors.runs}><Input type="number" min="0" disabled={didNotBat} value={form.runs} onChange={set('runs')} /></FormField>
        <FormField label="Balls Faced" error={errors.ballsFaced}><Input type="number" min="0" disabled={didNotBat} value={form.ballsFaced} onChange={set('ballsFaced')} /></FormField>
        <FormField label="Dismissal Type">
          <Select value={form.dismissalType} onChange={setDismissal}>
            {DISMISSAL_TYPES.map((d) => <option key={d}>{d}</option>)}
          </Select>
        </FormField>
        <FormField label="Fours" error={errors.fours}><Input type="number" min="0" disabled={didNotBat} value={form.fours} onChange={set('fours')} /></FormField>
        <FormField label="Sixes" error={errors.sixes}><Input type="number" min="0" disabled={didNotBat} value={form.sixes} onChange={set('sixes')} /></FormField>
        <FormField label="Strike Rate" hint="Calculated automatically."><Input disabled value={sr === null ? '—' : formatNumber(sr)} /></FormField>
        <FormField label="Boundary Runs" hint="Calculated automatically." error={errors.boundary}><Input disabled value={boundaryRuns} /></FormField>
      </div>

      <div className="form-section-label">Bowling</div>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <FormField label="Overs Bowled" hint="Cricket notation, e.g. 3.5 = 3 overs + 5 legal balls. Leave blank if the player did not bowl." error={errors.oversBowled}><Input value={form.oversBowled} onChange={set('oversBowled')} /></FormField>
        <FormField label="Runs Conceded" error={errors.runsConceded}><Input type="number" min="0" value={form.runsConceded} onChange={set('runsConceded')} /></FormField>
        <FormField label="Wickets" error={errors.wickets}><Input type="number" min="0" max="10" value={form.wickets} onChange={set('wickets')} /></FormField>
        <FormField label="Maidens" error={errors.maidens}><Input type="number" min="0" value={form.maidens} onChange={set('maidens')} /></FormField>
        <FormField label="Dot Balls" error={errors.dotBalls}><Input type="number" min="0" value={form.dotBalls} onChange={set('dotBalls')} /></FormField>
        <FormField label="Wides" error={errors.wides}><Input type="number" min="0" value={form.wides} onChange={set('wides')} /></FormField>
        <FormField label="No-balls" error={errors.noBalls}><Input type="number" min="0" value={form.noBalls} onChange={set('noBalls')} /></FormField>
        <FormField label="Economy Rate" hint="Calculated automatically."><Input disabled value={legalBalls === 0 ? '—' : (econ === null ? '—' : formatNumber(econ))} /></FormField>
      </div>

      <div className="form-section-label">Fielding</div>
      <div className="form-grid">
        <FormField label="Catches" error={errors.catches}><Input type="number" min="0" value={form.catches} onChange={set('catches')} /></FormField>
        <FormField label="Dropped Catches" error={errors.droppedCatches}><Input type="number" min="0" value={form.droppedCatches} onChange={set('droppedCatches')} /></FormField>
        <FormField label="Run Outs" error={errors.runOuts}><Input type="number" min="0" value={form.runOuts} onChange={set('runOuts')} /></FormField>
        {isWicketkeeper && <FormField label="Stumpings" error={errors.stumpings}><Input type="number" min="0" value={form.stumpings} onChange={set('stumpings')} /></FormField>}
        <FormField label="Misfields" error={errors.misfields}><Input type="number" min="0" value={form.misfields} onChange={set('misfields')} /></FormField>
        <FormField label="Fielding Score" hint="Calculated automatically."><Input disabled value={fieldScore} /></FormField>
      </div>
      <FormField label="Notes" full><Textarea rows={2} value={form.notes} onChange={set('notes')} /></FormField>
    </Modal>
  );
}
