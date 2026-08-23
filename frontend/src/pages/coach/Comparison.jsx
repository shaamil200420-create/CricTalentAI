import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import ChartContainer from '../../components/ChartContainer.jsx';
import { PLAYERS, MATCH_PERFORMANCE_P001, TRAINING_RECORDS_P001, AI_PREDICTIONS_P001 } from '../../data/mockData.js';
import { strikeRate, formatNumber } from '../../utils/cricket.js';

const MAX_SELECT = 4;

function metricsFor(player) {
  const hasDemoData = player.id === 'P001';
  if (!hasDemoData) {
    return { battingAvg: null, strikeRate: null, attendancePct: null, fitness: null, coachRating: null, aiScore: null };
  }
  const innings = MATCH_PERFORMANCE_P001;
  const totalRuns = innings.reduce((s, i) => s + i.runs, 0);
  const totalBalls = innings.reduce((s, i) => s + i.ballsFaced, 0);
  const dismissals = innings.filter((i) => i.isOut).length || 1;
  const present = TRAINING_RECORDS_P001.filter((r) => r.attendance === 'Present');
  const attendancePct = (present.length / TRAINING_RECORDS_P001.length) * 100;
  const fitness = present.length ? present[present.length - 1].fitnessScore : null;
  const ratings = present.map((r) => r.coachRating).filter((v) => v != null);
  const coachRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const aiScore = AI_PREDICTIONS_P001[0]?.score ?? null;
  return {
    battingAvg: totalRuns / dismissals,
    strikeRate: strikeRate(totalRuns, totalBalls),
    attendancePct, fitness, coachRating, aiScore,
  };
}

export default function Comparison() {
  const [selected, setSelected] = useState(['P001', 'P002']);

  const toggle = (id) => {
    setSelected((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      if (list.length >= MAX_SELECT) return list;
      return [...list, id];
    });
  };

  const rows = useMemo(
    () => selected.map((id) => ({ player: PLAYERS.find((p) => p.id === id), metrics: metricsFor(PLAYERS.find((p) => p.id === id)) })),
    [selected],
  );

  const chartData = rows.map((r) => ({ name: r.player.name.split(' ')[0], AIScore: r.metrics.aiScore ?? 0, CoachRating: r.metrics.coachRating ? Number(r.metrics.coachRating.toFixed(1)) : 0 }));

  return (
    <>
      <PageHeader title="Player Comparison" subtitle="Compare batting, fielding, fitness and AI scores side by side (FR9, up to 4 players)" />

      <Card title="Select Players" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PLAYERS.map((p) => (
            <label key={p.id} className={`filter-chip ${selected.includes(p.id) ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12.5, background: selected.includes(p.id) ? 'rgba(var(--color-primary-rgb),.14)' : 'transparent' }}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} style={{ margin: 0 }} />
              {p.name}
            </label>
          ))}
        </div>
        <p className="text-faint" style={{ fontSize: 11.5, marginTop: 10, marginBottom: 0 }}>Select up to {MAX_SELECT} players. Only P001 (Kasun Perera) has demo performance data in Phase 2 — others show "No data (demo)".</p>
      </Card>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Metric</th>
              {rows.map((r) => <th key={r.player.id}>{r.player.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <MetricRow label="Batting Average" rows={rows} pick={(m) => (m.battingAvg == null ? null : formatNumber(m.battingAvg))} />
            <MetricRow label="Strike Rate" rows={rows} pick={(m) => (m.strikeRate == null ? null : formatNumber(m.strikeRate))} />
            <MetricRow label="Attendance %" rows={rows} pick={(m) => (m.attendancePct == null ? null : `${formatNumber(m.attendancePct, 0)}%`)} />
            <MetricRow label="Fitness Score" rows={rows} pick={(m) => (m.fitness == null ? null : `${m.fitness} / 100`)} />
            <MetricRow label="Coach Rating" rows={rows} pick={(m) => (m.coachRating == null ? null : `${formatNumber(m.coachRating)} / 10`)} />
            <MetricRow label="AI Score (demo-shell)" rows={rows} pick={(m) => (m.aiScore == null ? null : m.aiScore)} />
          </tbody>
        </table>
      </div>

      <ChartContainer title="AI Score vs Coach Rating" sub="Demo-shell values — only P001 has recorded data" height={280}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Bar dataKey="AIScore" fill="var(--color-cyan)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="CoachRating" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </>
  );
}

function MetricRow({ label, rows, pick }) {
  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{label}</td>
      {rows.map((r) => {
        const v = pick(r.metrics);
        return <td key={r.player.id}>{v == null ? <span className="text-faint">No data (demo)</span> : v}</td>;
      })}
    </tr>
  );
}
