import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import ChartContainer from '../../components/ChartContainer.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import {
  PLAYERS, DEMO_IDENTITIES, MATCHES,
  MATCH_PERFORMANCE_P001, MATCH_PERFORMANCE_P002, MATCH_PERFORMANCE_P003, MATCH_PERFORMANCE_P004,
} from '../../data/mockData.js';
import { strikeRate, economyRate, ballsToOversNotation, formatNumber } from '../../utils/cricket.js';
import { formatDate } from '../../utils/format.js';

// One performance shell per role archetype (FR8) — the Player never picks
// their own role here; it's derived from the logged-in mock player's record.
const PERFORMANCE_BY_PLAYER = {
  P001: MATCH_PERFORMANCE_P001,
  P002: MATCH_PERFORMANCE_P002,
  P003: MATCH_PERFORMANCE_P003,
  P004: MATCH_PERFORMANCE_P004,
};

function matchLabel(m) {
  const match = MATCHES.find((x) => x.id === m.matchId);
  return match ? `${formatDate(match.date)} vs ${match.opponent}` : m.matchId;
}

export default function MyMatchStats() {
  const player = PLAYERS.find((p) => p.id === DEMO_IDENTITIES.player.playerId);
  const innings = PERFORMANCE_BY_PLAYER[player?.id];

  if (!player || !innings) {
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
      {player.role === 'All-Rounder'
        ? <AllRounderStats innings={innings} />
        : player.role === 'Bowler'
          ? <BowlerStats innings={innings} />
          : player.role === 'Wicketkeeper-Batter'
            ? <KeeperStats innings={innings} />
            : <BatterStats innings={innings} />}
    </>
  );
}

function BatterStats({ innings }) {
  const chartData = innings.map((m) => ({ name: matchLabel(m).split(' vs ')[0], Runs: m.runs }));
  return (
    <>
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
        <BattingTable innings={innings} showRunOuts />
      </Card>
    </>
  );
}

function BowlerStats({ innings }) {
  const chartData = innings.map((m) => ({ name: matchLabel(m).split(' vs ')[0], Wickets: m.wickets }));
  return (
    <>
      <ChartContainer title="Wickets by Match" sub="Most recent spells" height={260}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="Wickets" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <Card title="Spell-by-Spell" style={{ marginTop: 16 }}>
        <BowlingTable innings={innings} />
      </Card>
    </>
  );
}

function KeeperStats({ innings }) {
  const chartData = innings.map((m) => ({ name: matchLabel(m).split(' vs ')[0], Runs: m.runs }));
  return (
    <>
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
      <Card title="Innings-by-Innings (Batting & Keeping)" style={{ marginTop: 16 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Match</th><th>Runs</th><th>Balls</th><th>SR</th><th>4s</th><th>6s</th><th>Catches</th><th>Stumpings</th></tr></thead>
            <tbody>
              {innings.map((m) => (
                <tr key={m.matchId}>
                  <td>{matchLabel(m)}</td>
                  <td>{m.runs}{!m.isOut ? '*' : ''}</td>
                  <td>{m.ballsFaced}</td>
                  <td>{formatNumber(strikeRate(m.runs, m.ballsFaced))}</td>
                  <td>{m.fours}</td>
                  <td>{m.sixes}</td>
                  <td>{m.catches}</td>
                  <td>{m.stumpings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function AllRounderStats({ innings }) {
  const [tab, setTab] = useState('batting');
  const battingChart = innings.map((m) => ({ name: matchLabel(m).split(' vs ')[0], Runs: m.runs }));
  const bowlingChart = innings.map((m) => ({ name: matchLabel(m).split(' vs ')[0], Wickets: m.wickets }));

  return (
    <>
      <Tabs tabs={[{ value: 'batting', label: 'Batting' }, { value: 'bowling', label: 'Bowling' }]} active={tab} onChange={setTab} />
      {tab === 'batting' ? (
        <>
          <ChartContainer title="Runs by Match" sub="Most recent innings" height={240}>
            <ResponsiveContainer>
              <LineChart data={battingChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Runs" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <Card title="Innings-by-Innings (Batting)" style={{ marginTop: 16 }}>
            <BattingTable innings={innings} />
          </Card>
        </>
      ) : (
        <>
          <ChartContainer title="Wickets by Match" sub="Most recent spells" height={240}>
            <ResponsiveContainer>
              <LineChart data={bowlingChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Wickets" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <Card title="Spell-by-Spell (Bowling)" style={{ marginTop: 16 }}>
            <BowlingTable innings={innings} />
          </Card>
        </>
      )}
    </>
  );
}

// Shared table renderers — reused by Batter / Wicketkeeper (batting half) / All-Rounder.
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
              <td>{m.runs}{!m.isOut ? '*' : ''}</td>
              <td>{m.ballsFaced}</td>
              <td>{formatNumber(strikeRate(m.runs, m.ballsFaced))}</td>
              <td>{m.fours}</td>
              <td>{m.sixes}</td>
              <td>{m.catches}</td>
              {showRunOuts && <td>{m.runOuts ?? 0}</td>}
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
          {innings.map((m) => (
            <tr key={m.matchId}>
              <td>{matchLabel(m)}</td>
              <td>{ballsToOversNotation(m.legalBalls)}</td>
              <td>{m.wickets}</td>
              <td>{m.runsConceded}</td>
              <td>{formatNumber(economyRate(m.runsConceded, m.legalBalls))}</td>
              <td>{m.maidens}</td>
              <td>{m.catches}</td>
              <td>{m.runOuts ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
