import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import ChartContainer from '../../components/ChartContainer.jsx';
import { Card } from '../../components/Card.jsx';
import { TRAINING_RECORDS_P001, TRAINING_SESSIONS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

export default function MyTrainingProgress() {
  const chartData = TRAINING_RECORDS_P001.map((r) => {
    const session = TRAINING_SESSIONS.find((s) => s.id === r.sessionId);
    return {
      name: session ? formatDate(session.date) : r.sessionId,
      Fitness: r.fitnessScore ?? 0,
      Fielding: r.fieldingScore ?? 0,
    };
  });

  return (
    <>
      <PageHeader title="My Training Progress" subtitle="Fitness and fielding scores across your recorded sessions — view-only" />

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

      <Card kicker="Data note" style={{ marginTop: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Sessions marked Absent have no scores and are excluded from the trend line.
        </p>
      </Card>
    </>
  );
}
