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

// Old-style development-report section cards (player (4).html): an icon +
// uppercase section heading, then content, then a progress readout.
//
// Reads the SAME real MySQL Development Plan(s) the Coach -> Development
// Plan page creates (GET /development-plans/player/{myId}) for the
// AUTHENTICATED logged-in Player — never a hard-coded P001. No AI/ML
// generation here — this is Coach-authored content only, exactly as
// before. View-only.
export default function MyDevelopmentReport() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const myId = session?.identity?.id;

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!myId || session?.demo) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiRequest(`/development-plans/player/${myId}`)
      .then((list) => { if (!cancelled) setPlans(list); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, session?.demo]);

  return (
    <>
      <PageHeader title="My Development Report" subtitle="Your individual development plan, set by your coach — view-only" />

      <Card title="My Development Report" kicker="Coach-generated · view-only">
        {loading ? (
          <EmptyState icon="model_training" title="Loading your development report…" hint="Fetching your coach-authored development plan." />
        ) : !plans.length ? (
          <p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No development plan has been set yet.</p>
        ) : (
          plans.map((p) => (
            <div className="pp-section-card" key={p.id}>
              <div className="pp-section-head">
                <Icon name="model_training" filled size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="pp-section-head-title">{p.focusArea}</span>
                <span style={{ marginLeft: 'auto' }}><StatusBadge status={p.status} /></span>
              </div>
              {p.objective && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{p.objective}</p>}
              {(p.startDate || p.targetDate) && (
                <p className="text-faint mono" style={{ fontSize: 11, margin: '8px 0 0' }}>
                  {p.startDate ? formatDate(p.startDate) : '—'} → {p.targetDate ? formatDate(p.targetDate) : '—'}
                </p>
              )}
              {p.notes && (
                <ul className="pp-list" style={{ marginTop: 10 }}>
                  <li><Icon name="info" filled style={{ color: 'var(--color-cyan)' }} />{p.notes}</li>
                </ul>
              )}
              <div style={{ marginTop: 14, maxWidth: 340 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                  <span className="text-faint">Progress</span><span className="mono">{p.progressPct}%</span>
                </div>
                <ProgressBar value={p.progressPct} />
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
