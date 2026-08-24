import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import ChartContainer from '../../components/ChartContainer.jsx';
import { Card } from '../../components/Card.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';

function average(values) {
  const nums = values.filter((v) => v != null);
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// Player -> My Training Progress derives everything from the SAME real
// training_records Coach -> Training Entry writes (GET /training-records/
// player/{myId}), joined with GET /schedules for real session dates — no
// separate training-progress table, no mock TRAINING_RECORDS_P001, no
// hard-coded player. VIEW ONLY, same computations/charts as before.
export default function MyTrainingProgress() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const myId = session?.identity?.id;

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!myId || session?.demo) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([apiRequest(`/training-records/player/${myId}`), apiRequest('/schedules')])
      .then(([trainingRecords, schedules]) => {
        if (cancelled) return;
        setRecords(trainingRecords.map((r) => ({ ...r, session: schedules.find((s) => s.id === r.sessionId) })));
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, session?.demo]);

  if (loading) {
    return (
      <>
        <PageHeader title="My Training Progress" subtitle="Fitness, fielding and attendance across your recorded sessions — view-only" />
        <Card><EmptyState icon="trending_up" title="Loading your training progress…" hint="Fetching your recorded sessions." /></Card>
      </>
    );
  }

  if (!records.length) {
    return (
      <>
        <PageHeader title="My Training Progress" subtitle="Fitness, fielding and attendance across your recorded sessions — view-only" />
        <Card><EmptyState icon="trending_up" title="No training records yet" hint="Your progress charts will appear here once your Coach logs a training session for you." /></Card>
      </>
    );
  }

  const attendancePct = Math.round((records.filter((r) => r.attendance === 'Present').length / records.length) * 100);
  const drillPct = average(records.filter((r) => r.attendance === 'Present').map((r) => (r.drillsAssigned ? Math.round((r.drillsCompleted / r.drillsAssigned) * 100) : null)));
  const avgBatting = average(records.map((r) => r.battingPractice));
  const avgBowling = average(records.map((r) => r.bowlingPractice));
  const avgFielding = average(records.map((r) => r.fieldingScore));
  const avgFitness = average(records.map((r) => r.fitnessScore));

  const summary = [
    { label: 'Attendance', value: attendancePct },
    { label: 'Drill Completion', value: drillPct },
    { label: 'Avg Batting Practice', value: avgBatting },
    { label: 'Avg Bowling Practice', value: avgBowling },
    { label: 'Avg Fielding Practice', value: avgFielding },
    { label: 'Fitness Score', value: avgFitness },
  ].filter((s) => s.value != null);

  // Absent sessions have no recorded fitness/fielding score (null), so they
  // are filtered out before charting rather than coerced to 0 — a session
  // the player missed should not appear as a performance crash to zero.
  const chartData = records
    .filter((r) => r.attendance === 'Present')
    .map((r) => ({
      name: r.session ? formatDate(r.session.date) : r.sessionId,
      Fitness: r.fitnessScore,
      Fielding: r.fieldingScore,
    }));

  const attendanceChart = records.map((r) => ({
    name: r.session ? formatDate(r.session.date) : r.sessionId,
    Attendance: r.attendance === 'Present' ? 1 : 0,
    label: r.attendance,
  }));

  return (
    <>
      <PageHeader title="My Training Progress" subtitle="Fitness, fielding and attendance across your recorded sessions — view-only" />

      <Card title="Training Progress Summary" kicker="Based on coach-entered training data" style={{ marginBottom: 16 }}>
        <div className="pp-progress-grid">
          {summary.map((s) => (
            <div className="pp-progress-cell" key={s.label}>
              <div className="pp-progress-label">{s.label}</div>
              <div className="pp-progress-value">{s.value}{s.label === 'Attendance' || s.label === 'Drill Completion' ? '%' : '/100'}</div>
              <ProgressBar value={s.value} />
              <div className="pp-progress-note" style={{ color: s.value >= 85 ? 'var(--color-primary)' : s.value >= 70 ? 'var(--color-amber)' : 'var(--color-error)' }}>
                {s.value >= 85 ? 'On Track' : s.value >= 70 ? 'Improving' : 'Needs Improvement'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <ChartContainer title="Fitness & Fielding Trend" sub="0–100 scale" height={280}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Legend />
            <Line type="monotone" dataKey="Fitness" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Fielding" stroke="var(--color-cyan)" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div style={{ marginTop: 16 }}>
        <ChartContainer title="Attendance Trend" sub="Present (1) vs Absent (0) per session" height={220}>
          <ResponsiveContainer>
            <BarChart data={attendanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(value, name, props) => [props.payload.label, 'Attendance']}
              />
              <Bar dataKey="Attendance" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <Card kicker="Data note" style={{ marginTop: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Sessions marked Absent have no scores and are excluded from the trend line.
        </p>
      </Card>
    </>
  );
}
