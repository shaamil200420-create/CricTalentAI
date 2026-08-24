import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import ChartContainer from '../../components/ChartContainer.jsx';
import Button from '../../components/Button.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { strikeRate, economyRate, ballsToOversNotation, oversNotationToBalls, formatNumber } from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../services/api.js';

const TREND_METRICS = [
  { value: 'runs', label: 'Runs' },
  { value: 'strikeRate', label: 'Strike Rate' },
  { value: 'wickets', label: 'Wickets' },
  { value: 'economy', label: 'Economy' },
  { value: 'attendance', label: 'Attendance' },
];

// Adapts a real MatchPerformanceOut (+ its matched real Match record) into
// the innings shape the tables/charts below render. `runs`/`wickets` stay
// NULL (not 0) exactly when Did Not Bat / did not bowl — that null is what
// drives the "—" display and the canBat/canBowl applicability checks, per
// the required "did-not-bat vs 0" / "did-not-bowl vs 0 wickets" distinction.
function toInningsShape(perf, matches) {
  const match = matches.find((m) => m.id === perf.matchId);
  const didNotBat = perf.dismissalType === 'Did Not Bat';
  const bowled = !!perf.oversBowled;
  return {
    matchId: perf.matchId,
    match,
    didNotBat,
    runs: didNotBat ? null : perf.runs,
    ballsFaced: didNotBat ? null : perf.ballsFaced,
    fours: didNotBat ? null : perf.fours,
    sixes: didNotBat ? null : perf.sixes,
    isOut: !didNotBat && perf.dismissalType !== 'Not Out',
    catches: perf.catches ?? 0,
    runOuts: perf.runOuts ?? 0,
    stumpings: perf.stumpings ?? 0,
    wickets: bowled ? perf.wickets : null,
    runsConceded: bowled ? perf.runsConceded : null,
    maidens: bowled ? perf.maidens : null,
    legalBalls: bowled ? oversNotationToBalls(perf.oversBowled) : 0,
  };
}

function matchLabel(m) {
  return m.match ? `${formatDate(m.match.date)} vs ${m.match.opponent}` : m.matchId;
}

// Player -> My Match Stats reads the SAME real MySQL Match Performance
// records Coach -> Match Entry creates and Coach -> Match Records
// edits/removes (GET /match-performance/player/{myId}) — never a
// hard-coded P001. If the Coach edits a record, this page shows the
// updated figures on next load; if the Coach removes one, it disappears
// from here too, since both pages read the same source. VIEW ONLY — no
// Add/Edit/Remove affordances anywhere on this page.
export default function MyMatchStats() {
  const { session } = useAuth();
  const [player, setPlayer] = useState(null);
  const [innings, setInnings] = useState(null); // null = still loading
  const [trainingAttendance, setTrainingAttendance] = useState([]);

  useEffect(() => {
    if (!session?.identity?.id || session.demo) {
      setInnings([]);
      return;
    }
    const myId = session.identity.id;
    Promise.all([
      apiRequest('/players'), // self-scoped for a logged-in Player — returns just my own profile
      apiRequest(`/match-performance/player/${myId}`),
      apiRequest('/matches'),
      apiRequest(`/training-records/player/${myId}`),
      apiRequest('/schedules'),
    ]).then(([players, performances, matches, trainingRecords, schedules]) => {
      setPlayer(players[0] || null);
      setInnings(performances.map((p) => toInningsShape(p, matches)));
      setTrainingAttendance(trainingRecords.map((r) => ({
        ...r,
        session: schedules.find((s) => s.id === r.sessionId),
      })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (innings === null) {
    return (
      <>
        <PageHeader title="My Match Stats" subtitle="Your official recorded innings — view-only" />
        <Card><EmptyState icon="query_stats" title="Loading your match stats…" hint="Fetching your recorded performances." /></Card>
      </>
    );
  }

  if (!player || !innings.length) {
    return (
      <>
        <PageHeader title="My Match Stats" subtitle="Your official recorded innings — view-only" />
        <Card><EmptyState icon="query_stats" title="No match performance recorded yet" hint="Your stats will appear here once the Coach logs a match performance for you." /></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Match Stats" subtitle={`Your official recorded innings — view-only · ${player.role}`} />

      <PerformanceTrend role={player.role} innings={innings} trainingAttendance={trainingAttendance} />

      <div style={{ marginTop: 16 }}>
        {player.role === 'All-Rounder'
          ? <AllRounderTable innings={innings} />
          : player.role === 'Bowler'
            ? <Card title="Innings-by-Innings (Bowling)"><BowlingTable innings={innings} /></Card>
            : player.role === 'Wicketkeeper-Batter'
              ? <Card title="Innings-by-Innings (Batting & Keeping)"><KeeperTable innings={innings} /></Card>
              : <Card title="Innings-by-Innings"><BattingTable innings={innings} showRunOuts /></Card>}
      </div>
    </>
  );
}

// ── Performance Trend — ONE reusable trend card (FR10) ──────────────────
function PerformanceTrend({ role, innings, trainingAttendance }) {
  const [metric, setMetric] = useState('runs');

  const canBat = innings?.some((m) => m.runs != null);
  const canBowl = innings?.some((m) => m.wickets != null);

  const applicability = {
    runs: canBat,
    strikeRate: canBat,
    wickets: canBowl,
    economy: canBowl,
    attendance: !!trainingAttendance?.length,
  };
  const isApplicable = applicability[metric];

  const matchChartData = useMemo(() => innings.map((m) => ({
    name: matchLabel(m).split(' vs ')[0],
    runs: m.runs,
    strikeRate: strikeRate(m.runs, m.ballsFaced) ?? 0,
    wickets: m.wickets,
    economy: economyRate(m.runsConceded, m.legalBalls) ?? 0,
  })), [innings]);

  const attendanceChartData = useMemo(() => (trainingAttendance ?? []).map((r) => ({
    name: r.session ? formatDate(r.session.date) : r.sessionId,
    attendance: r.attendance === 'Present' ? 1 : 0,
    label: r.attendance,
  })), [trainingAttendance]);

  const METRIC_CONFIG = {
    runs: { dataKey: 'runs', title: 'Runs by Match', color: 'var(--color-primary)', integer: true },
    strikeRate: { dataKey: 'strikeRate', title: 'Strike Rate by Match', color: 'var(--color-cyan)' },
    wickets: { dataKey: 'wickets', title: 'Wickets by Match', color: 'var(--color-primary)', integer: true },
    economy: { dataKey: 'economy', title: 'Economy Rate by Match', color: 'var(--color-cyan)' },
  };

  return (
    <Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
        <div>
          <div className="card-title" style={{ fontSize: 15 }}>Performance Trend</div>
          <div className="text-faint" style={{ fontSize: 11.5, marginTop: 2 }}>Recent matches &amp; sessions (FR10) — {role}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TREND_METRICS.map((m) => (
            <Button key={m.value} size="sm" variant={metric === m.value ? 'primary' : 'secondary'} onClick={() => setMetric(m.value)}>
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {!isApplicable ? (
        <EmptyState
          icon="block"
          title="Not applicable for this player's role"
          hint={
            metric === 'attendance'
              ? 'No training records are available for this player yet.'
              : `${TREND_METRICS.find((m) => m.value === metric)?.label} does not apply to a ${role}, or no match performance is recorded for this player yet.`
          }
        />
      ) : metric === 'attendance' ? (
        <ChartContainer title="Attendance Trend" sub="Present (1) vs Absent (0) per session" height={280}>
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
        <ChartContainer title={METRIC_CONFIG[metric].title} sub="Most recent matches" height={280}>
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
    </Card>
  );
}

// ── Innings-by-Innings — role-aware table only, no charts here ──────────
function AllRounderTable({ innings }) {
  const [tab, setTab] = useState('batting');
  return (
    <Card title="Innings-by-Innings">
      <Tabs tabs={[{ value: 'batting', label: 'Batting' }, { value: 'bowling', label: 'Bowling' }]} active={tab} onChange={setTab} />
      <div style={{ marginTop: 12 }}>
        {tab === 'batting' ? <BattingTable innings={innings} /> : <BowlingTable innings={innings} />}
      </div>
    </Card>
  );
}

function BattingTable({ innings, showRunOuts = false }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Match</th><th>Runs</th><th>Balls</th><th>SR</th><th>4s</th><th>6s</th><th>Catches</th>
            {showRunOuts && <th>Run Outs</th>}
          </tr>
        </thead>
        <tbody>
          {innings.map((m) => (
            <tr key={m.matchId}>
              <td>{matchLabel(m)}</td>
              <td>{m.didNotBat ? '—' : `${m.runs}${!m.isOut ? '*' : ''}`}</td>
              <td>{m.didNotBat ? '—' : m.ballsFaced}</td>
              <td>{m.didNotBat ? '—' : formatNumber(strikeRate(m.runs, m.ballsFaced))}</td>
              <td>{m.didNotBat ? '—' : m.fours}</td>
              <td>{m.didNotBat ? '—' : m.sixes}</td>
              <td>{m.catches}</td>
              {showRunOuts && <td>{m.runOuts}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BowlingTable({ innings }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Match</th><th>Overs</th><th>Wickets</th><th>Runs Conceded</th><th>Economy</th><th>Maidens</th><th>Catches</th><th>Run Outs</th></tr></thead>
        <tbody>
          {innings.map((m) => {
            const bowled = m.wickets !== null;
            return (
              <tr key={m.matchId}>
                <td>{matchLabel(m)}</td>
                <td>{bowled ? ballsToOversNotation(m.legalBalls) : '—'}</td>
                <td>{bowled ? m.wickets : '—'}</td>
                <td>{bowled ? m.runsConceded : '—'}</td>
                <td>{bowled ? formatNumber(economyRate(m.runsConceded, m.legalBalls)) : '—'}</td>
                <td>{bowled ? m.maidens : '—'}</td>
                <td>{m.catches}</td>
                <td>{m.runOuts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function KeeperTable({ innings }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Match</th><th>Runs</th><th>Balls</th><th>SR</th><th>4s</th><th>6s</th><th>Catches</th><th>Stumpings</th></tr></thead>
        <tbody>
          {innings.map((m) => (
            <tr key={m.matchId}>
              <td>{matchLabel(m)}</td>
              <td>{m.didNotBat ? '—' : `${m.runs}${!m.isOut ? '*' : ''}`}</td>
              <td>{m.didNotBat ? '—' : m.ballsFaced}</td>
              <td>{m.didNotBat ? '—' : formatNumber(strikeRate(m.runs, m.ballsFaced))}</td>
              <td>{m.didNotBat ? '—' : m.fours}</td>
              <td>{m.didNotBat ? '—' : m.sixes}</td>
              <td>{m.catches}</td>
              <td>{m.stumpings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
