import { useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { StatCard, Card } from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { Badge, StatusBadge } from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';
import { strikeRate, formatNumber } from '../../utils/cricket.js';
import { formatDate, initials, sortByDateTime } from '../../utils/format.js';

// Player Dashboard and My Profile were two separate pages that ended up
// repeating/duplicating the same player-identity content, leaving both with
// large empty areas once that duplication was removed. Both sidebar routes
// ("Dashboard" and "My Profile") now render THIS one shared component —
// see Dashboard.jsx and MyProfile.jsx, which are thin wrappers around it —
// so there is a single implementation instead of two that could drift apart.
// `focusProfile` is the only thing that differs between the two entry
// points: My Profile scrolls straight to the Profile Details section,
// Dashboard starts at the top.
//
// Every value on this page now comes from the AUTHENTICATED logged-in
// Player's own real MySQL records — never a hard-coded P001/Kasun:
//   - Profile fields (id/name/age/role/battingStyle/bowlingStyle/height/
//     weight/status): GET /players (self-scoped for role=PLAYER — the
//     same shared Player Directory Coach/Admin use).
//   - Runs / Strike Rate ("last 5 innings"): GET /match-performance/player/
//     {myId}, joined with GET /matches for real match dates, ordered by
//     that real date — never the ML model, just DB aggregation.
//   - Active Goals: GET /goals/player/{myId}.
//   - Upcoming Schedule: GET /matches + GET /schedules — the exact same
//     shared records My Schedule / Admin / Coach Schedule Management use.
// Fitness is intentionally NOT shown here (Training Records owns it).
export default function PlayerOverview({ focusProfile = false }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const identity = session?.identity;
  const myId = identity?.id;

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [recentRuns, setRecentRuns] = useState(0);
  const [totalBalls, setTotalBalls] = useState(0);
  const [inningsCount, setInningsCount] = useState(0);
  const [activeGoals, setActiveGoals] = useState(0);
  const [upcoming, setUpcoming] = useState([]);

  const profileRef = useRef(null);

  useEffect(() => {
    if (focusProfile) {
      profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusProfile]);

  useEffect(() => {
    if (!myId || session?.demo) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiRequest('/players'),
      apiRequest(`/match-performance/player/${myId}`),
      apiRequest('/matches'),
      apiRequest('/schedules'),
      apiRequest(`/goals/player/${myId}`),
    ])
      .then(([players, performances, matches, schedules, goals]) => {
        if (cancelled) return;
        setPlayer(players.find((p) => p.id === myId) ?? null);

        // Last 5 innings — only matches this player actually batted in
        // (runs != null; a "Did Not Bat" record has no innings to count),
        // ordered by the REAL match date, most recent first.
        const batted = performances
          .filter((p) => p.runs != null)
          .map((p) => ({ ...p, match: matches.find((m) => m.id === p.matchId) }))
          .filter((p) => p.match)
          .sort((a, b) => new Date(b.match.date) - new Date(a.match.date))
          .slice(0, 5);
        setRecentRuns(batted.reduce((s, p) => s + (p.runs || 0), 0));
        setTotalBalls(batted.reduce((s, p) => s + (p.ballsFaced || 0), 0));
        setInningsCount(batted.length);

        setActiveGoals(goals.filter((g) => g.status === 'In Progress').length);

        const matchItems = matches
          .filter((m) => m.status === 'Scheduled')
          .map((m) => ({ id: `match-${m.id}`, kind: 'Match', title: `vs ${m.opponent}`, date: m.date, time: m.time }));
        const trainingItems = schedules
          .filter((s) => s.status === 'Scheduled')
          .map((s) => ({ id: `training-${s.id}`, kind: 'Training', title: s.title, date: s.date, time: s.time }));
        setUpcoming(sortByDateTime([...matchItems, ...trainingItems]).slice(0, 3));
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, session?.demo]);

  const fields = player ? [
    { label: 'Player ID', value: player.id, mono: true },
    { label: 'Full Name', value: player.name },
    { label: 'Age', value: player.age ?? '—' },
    { label: 'Primary Role', value: player.role ?? '—' },
    { label: 'Batting Style', value: player.battingStyle ?? '—' },
    { label: 'Bowling Style', value: player.bowlingStyle ?? '—' },
    { label: 'Height', value: player.heightCm != null ? `${player.heightCm} cm` : '—' },
    { label: 'Weight', value: player.weightKg != null ? `${player.weightKg} kg` : '—' },
  ] : [];

  return (
    <>
      <PageHeader title={`Welcome, ${identity?.name?.split(' ')[0] ?? 'Player'}`} subtitle="Your progress, at a glance — everything here is view-only" />

      <div ref={profileRef} id="profile-details">
        <Card kicker="Profile Details" title="My Profile" style={{ marginBottom: 20 }}>
          {loading ? (
            <EmptyState icon="person" title="Loading your profile…" hint="Fetching your saved player profile." />
          ) : !player ? (
            <EmptyState icon="person_off" title="Profile not found" hint="Your player profile could not be loaded. Please contact your Coach/Admin." />
          ) : (
            <>
              <div className="pp-hero" style={{ marginBottom: 22 }}>
                <div className="pp-hero-avatar-wrap">
                  <div className="pp-hero-avatar">{initials(player.name)}</div>
                  <span className="pp-hero-id-tag">{player.id}</span>
                </div>
                <div className="pp-hero-body">
                  <div className="pp-hero-name">{player.name}</div>
                  <div className="pp-hero-role">{player.role}</div>
                </div>
                <Badge tone="neutral">View Only</Badge>
              </div>

              <div className="pp-info-grid">
                {fields.map((f) => (
                  <div className="pp-info-cell" key={f.label}>
                    <div className="pp-info-label">{f.label}</div>
                    <div className={`pp-info-value${f.mono ? ' mono' : ''}`}>{f.value}</div>
                  </div>
                ))}
                <div className="pp-info-cell">
                  <div className="pp-info-label">Player Status</div>
                  <div className="pp-info-value"><StatusBadge status={player.status} /></div>
                </div>
              </div>

              <p className="text-faint" style={{ fontSize: 11.5, marginTop: 16, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="lock" size={14} /> This information is view-only. Official records are managed by your coach/admin.
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Runs (last 5 innings)" value={inningsCount ? recentRuns : '—'} icon={<Icon name="sports_cricket" />} />
        <StatCard label="Strike Rate" value={inningsCount ? formatNumber(strikeRate(recentRuns, totalBalls)) : '—'} icon={<Icon name="bolt" />} tone="cyan" />
        <StatCard label="Active Goals" value={activeGoals} icon={<Icon name="flag" />} tone="error" />
      </div>

      <Card kicker="Next up" title="Upcoming Schedule">
        {upcoming.length ? (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map((s) => (
              <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span><Badge tone={s.kind === 'Match' ? 'cyan' : 'primary'}>{s.kind}</Badge> &nbsp;{s.title}</span>
                <span className="text-faint mono" style={{ fontSize: 11.5 }}>{formatDate(s.date)} · {s.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-faint" style={{ fontSize: 13, margin: 0 }}>No upcoming matches or training sessions scheduled yet.</p>
        )}
      </Card>
    </>
  );
}
