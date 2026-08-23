import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card, StatCard } from '../../components/Card.jsx';
import { Badge, StatusBadge } from '../../components/Badge.jsx';
import { FormField, Select } from '../../components/FormField.jsx';
import { PLAYERS, AI_PREDICTIONS_P001 } from '../../data/mockData.js';
import { requestPrediction } from '../../services/ai.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AIPredictions() {
  const [playerId, setPlayerId] = useState('P001');
  const { showToast } = useToast();
  const player = PLAYERS.find((p) => p.id === playerId);
  const history = playerId === 'P001' ? AI_PREDICTIONS_P001 : [];
  const latest = history[0];

  const request = async () => {
    try {
      await requestPrediction(playerId);
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="AI Prediction View"
        subtitle="Prediction score, potential level, archetype and history (FR11 / FR12 / FR20) — Coach-only"
        actions={<Button icon="bolt" onClick={request}>Request New Prediction</Button>}
      />

      <Card title="Player" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <FormField label="Player">
            <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              {PLAYERS.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </Select>
          </FormField>
        </div>
      </Card>

      {latest ? (
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <StatCard label="Latest Score" value={latest.score} sub="demo-shell value" />
          <StatCard label="Potential Level" value={latest.potentialLevel} tone="cyan" />
          <StatCard label="Archetype" value={latest.archetype} tone="amber" />
          <StatCard label="Model Version" value={<span className="mono">{latest.modelVersion}</span>} tone="error" sub="no model trained yet" />
        </div>
      ) : (
        <Card style={{ marginBottom: 20 }}>
          <p className="text-faint" style={{ fontSize: 13, margin: 0 }}>No AI prediction has been generated for {player?.name} yet in this demo.</p>
        </Card>
      )}

      <Card title="Prediction History">
        {history.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Score</th><th>Potential</th><th>Archetype</th><th>Model Version</th><th>Review Status</th></tr></thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td>{p.score}</td>
                    <td>{p.potentialLevel}</td>
                    <td>{p.archetype}</td>
                    <td><span className="mono">{p.modelVersion}</span></td>
                    <td><StatusBadge status={p.reviewStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-faint" style={{ fontSize: 13, margin: 0 }}>No prediction history yet.</p>
        )}
      </Card>

      <Card kicker="Data note" style={{ marginTop: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Every value here is a UI shell — <Badge tone="warn">demo-shell</Badge> — no ML model has been trained or run. Real scores
          arrive once the trained model and AI microservice exist (Phase 12–14).
        </p>
      </Card>
    </>
  );
}
