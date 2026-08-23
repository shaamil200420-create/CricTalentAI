import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import ChartContainer from '../../components/ChartContainer.jsx';
import { MATCH_PERFORMANCE_P001, MATCHES } from '../../data/mockData.js';
import { strikeRate, formatNumber } from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';

export default function MyMatchStats() {
  const chartData = MATCH_PERFORMANCE_P001.map((m) => {
    const match = MATCHES.find((x) => x.id === m.matchId);
    return { name: match ? formatDate(match.date) : m.matchId, Runs: m.runs };
  });

  return (
    <>
      <PageHeader title="My Match Stats" subtitle="Your official recorded innings — view-only" />

      <ChartContainer title="Runs by Match" sub="Most recent innings" height={260}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="Runs" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <Card title="Innings-by-Innings" style={{ marginTop: 16 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Match</th><th>Runs</th><th>Balls</th><th>SR</th><th>4s</th><th>6s</th><th>Catches</th></tr></thead>
            <tbody>
              {MATCH_PERFORMANCE_P001.map((m) => {
                const match = MATCHES.find((x) => x.id === m.matchId);
                return (
                  <tr key={m.matchId}>
                    <td>{match ? `${formatDate(match.date)} vs ${match.opponent}` : m.matchId}</td>
                    <td>{m.runs}{!m.isOut ? '*' : ''}</td>
                    <td>{m.ballsFaced}</td>
                    <td>{formatNumber(strikeRate(m.runs, m.ballsFaced))}</td>
                    <td>{m.fours}</td>
                    <td>{m.sixes}</td>
                    <td>{m.catches}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
