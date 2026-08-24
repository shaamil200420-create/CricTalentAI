import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';
import { formatDate, initials } from '../../utils/format.js';

// Old-style stacked feedback cards (player (4).html): coach avatar/initials +
// name + context/date up top, feedback text below. View-only.
//
// Reads the SAME real MySQL Feedback the Coach -> Player List detail
// modal's Feedback tab creates (GET /feedback/player/{myId}) for the
// AUTHENTICATED logged-in Player — never a hard-coded P001. The backend
// itself already filters out PRIVATE (internal coach-only) notes for a
// Player, so every row returned here is safe to show as-is.
export default function MyFeedback() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const myId = session?.identity?.id;

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    if (!myId || session?.demo) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiRequest(`/feedback/player/${myId}`)
      .then((list) => { if (!cancelled) setFeedback(list); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, session?.demo]);

  const coachName = feedback[0]?.coachName || 'Your Coach';

  return (
    <>
      <PageHeader title="My Feedback" subtitle="Feedback your coach has shared with you" />

      <Card title="My Feedback" kicker="Shared by your coach">
        {loading ? (
          <EmptyState icon="forum" title="Loading your feedback…" hint="Fetching feedback shared by your coach." />
        ) : !feedback.length ? (
          <p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No feedback shared with you yet.</p>
        ) : (
          feedback.map((f) => (
            <div className="pp-feedback-card" key={f.id}>
              <div className="pp-feedback-head">
                <div className="pp-feedback-who">
                  <div className="pp-feedback-avatar">{initials(coachName)}</div>
                  <div>
                    <div className="pp-feedback-name">Coach {coachName}</div>
                    <div className="pp-feedback-context">{formatDate(f.date)}</div>
                  </div>
                </div>
                {f.strengths && <Icon name="star" filled size={22} style={{ color: 'var(--color-primary)' }} />}
              </div>
              <p className="pp-feedback-text">{f.text}</p>
              {f.strengths && <p style={{ margin: '10px 0 0', fontSize: 12.5 }}><strong>Strengths:</strong> {f.strengths}</p>}
              {f.areasToImprove && <p style={{ margin: '4px 0 0', fontSize: 12.5 }}><strong>Areas to improve:</strong> {f.areasToImprove}</p>}
            </div>
          ))
        )}
      </Card>
    </>
  );
}
