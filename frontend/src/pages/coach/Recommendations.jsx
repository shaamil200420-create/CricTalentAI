import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Badge, StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import { FormField, Input, Textarea } from '../../components/FormField.jsx';
import { AI_PREDICTIONS_P001, PLAYERS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

const PRIORITY_TONE = { High: 'error', Medium: 'warn', Low: 'info' };

export default function Recommendations() {
  const [items, setItems] = useState(
    AI_PREDICTIONS_P001.map((p) => ({
      id: p.id, playerId: 'P001', date: p.date, focus: p.recommendation.focus,
      reason: p.recommendation.reason, priority: p.recommendation.priority, status: p.reviewStatus,
    })),
  );
  const [modifyTarget, setModifyTarget] = useState(null);
  const { showToast } = useToast();

  const setStatus = (id, status) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
    showToast(`Recommendation marked ${status} (demo only).`);
  };

  return (
    <>
      <PageHeader title="Training Recommendation" subtitle="Accept, reject or modify AI-suggested training focus areas (FR13)" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((rec) => {
          const player = PLAYERS.find((p) => p.id === rec.playerId);
          return (
            <Card key={rec.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{rec.focus}</span>
                    <Badge tone={PRIORITY_TONE[rec.priority]}>{rec.priority} priority</Badge>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{rec.reason}</p>
                  <p className="text-faint mono" style={{ fontSize: 11, marginTop: 6, marginBottom: 0 }}>{player?.name} · {formatDate(rec.date)}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="primary" icon="check" disabled={rec.status === 'ACCEPTED'} onClick={() => setStatus(rec.id, 'ACCEPTED')}>Accept</Button>
                  <Button size="sm" variant="secondary" icon="edit" onClick={() => setModifyTarget(rec)}>Modify</Button>
                  <Button size="sm" variant="danger" icon="close" disabled={rec.status === 'REJECTED'} onClick={() => setStatus(rec.id, 'REJECTED')}>Reject</Button>
                </div>
              </div>
            </Card>
          );
        })}
        {!items.length && (
          <Card><p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No recommendations yet.</p></Card>
        )}
      </div>

      {modifyTarget && (
        <ModifyModal
          rec={modifyTarget}
          onClose={() => setModifyTarget(null)}
          onSave={(focus, reason) => {
            setItems((list) => list.map((i) => (i.id === modifyTarget.id ? { ...i, focus, reason, status: 'MODIFIED' } : i)));
            showToast('Recommendation modified (demo only).');
            setModifyTarget(null);
          }}
        />
      )}
    </>
  );
}

function ModifyModal({ rec, onClose, onSave }) {
  const [focus, setFocus] = useState(rec.focus);
  const [reason, setReason] = useState(rec.reason);

  return (
    <Modal
      open
      onClose={onClose}
      title="Modify Recommendation"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={() => onSave(focus, reason)}>Save as Modified</Button>
      </>}
    >
      <div className="form-grid">
        <FormField label="Focus Area" full><Input value={focus} onChange={(e) => setFocus(e.target.value)} /></FormField>
        <FormField label="Reason" full><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>
      </div>
    </Modal>
  );
}
