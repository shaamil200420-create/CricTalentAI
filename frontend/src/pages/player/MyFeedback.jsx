import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { FEEDBACK_P001 } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';

// Only PLAYER_VISIBLE feedback is ever shown here — PRIVATE coach notes
// (internal-only observations) must never reach the Player portal.
const visibleFeedback = FEEDBACK_P001.filter((f) => f.visibility === 'PLAYER_VISIBLE');

export default function MyFeedback() {
  return (
    <>
      <PageHeader title="My Feedback" subtitle="Feedback your coach has shared with you" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {visibleFeedback.map((f) => (
          <Card key={f.id}>
            <p className="text-faint mono" style={{ fontSize: 11, margin: '0 0 6px' }}>{formatDate(f.date)}</p>
            <p style={{ margin: 0, fontSize: 13.5 }}>{f.text}</p>
            {f.strengths && <p style={{ margin: '8px 0 0', fontSize: 12.5 }}><strong>Strengths:</strong> {f.strengths}</p>}
            {f.areasToImprove && <p style={{ margin: '4px 0 0', fontSize: 12.5 }}><strong>Areas to improve:</strong> {f.areasToImprove}</p>}
          </Card>
        ))}
        {!visibleFeedback.length && <Card><p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No feedback shared with you yet.</p></Card>}
      </div>
    </>
  );
}
