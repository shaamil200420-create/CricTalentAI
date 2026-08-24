import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import Icon from '../../components/Icon.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';

// Old-style horizontal goal cards (player (4).html): icon + title/deadline on
// the left, status badge on the right, progress bar + text underneath.
// Reads the SAME real MySQL Goals the Coach -> Goal Tracking page creates
// (GET /goals/player/{myId}) for the AUTHENTICATED logged-in Player — never
// a hard-coded P001. View-only: no add/edit/delete/target controls.
export default function MyGoals() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const myId = session?.identity?.id;

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (!myId || session?.demo) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiRequest(`/goals/player/${myId}`)
      .then((list) => { if (!cancelled) setGoals(list); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, session?.demo]);

  return (
    <>
      <PageHeader title="My Goals" subtitle="Goals set by your coach — view-only" />

      <Card title="My Goals" kicker="Track your progress">
        {loading ? (
          <EmptyState icon="flag" title="Loading your goals…" hint="Fetching goals set by your coach." />
        ) : !goals.length ? (
          <p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No goals set yet.</p>
        ) : (
          goals.map((g) => (
            <div className="pp-goal-card" key={g.id}>
              <div className="pp-goal-head">
                <div className="pp-goal-title-row">
                  <div className="pp-goal-icon"><Icon name="flag" filled size={18} /></div>
                  <div>
                    <div className="pp-goal-title">{g.focusArea}</div>
                    <div className="pp-goal-deadline">{g.deadline ? `Deadline: ${formatDate(g.deadline)}` : 'No deadline set'}</div>
                  </div>
                </div>
                <StatusBadge status={g.status} />
              </div>
              <div style={{ marginTop: 14 }}>
                <div className="pp-goal-progress-row">
                  <span>{g.target || '—'}</span>
                  <span className="mono">{g.progressPct}%</span>
                </div>
                <ProgressBar value={g.progressPct} />
                <div className="pp-goal-progress-text">
                  {g.progressPct >= 100 ? 'Goal achieved' : `${g.progressPct}% progress`}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
