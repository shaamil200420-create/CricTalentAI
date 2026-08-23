import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import { FormField, Input } from '../../components/FormField.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { PLAYERS, TRAINING_RECORDS_P001 } from '../../data/mockData.js';

export default function MyProfile() {
  const player = PLAYERS.find((p) => p.id === 'P001');
  const withScore = [...TRAINING_RECORDS_P001].reverse().find((r) => r.fitnessScore != null);
  const fitness = withScore ? `${withScore.fitnessScore} / 100` : 'Not yet recorded';

  return (
    <>
      <PageHeader title="My Profile" subtitle="View-only — contact your coach or an administrator to request changes" />

      <Card>
        <div className="form-grid">
          <FormField label="Player ID"><Input disabled value={player.id} /></FormField>
          <FormField label="Full Name"><Input disabled value={player.name} /></FormField>
          <FormField label="Age"><Input disabled value={player.age} /></FormField>
          <FormField label="Role"><Input disabled value={player.role} /></FormField>
          <FormField label="Batting Style"><Input disabled value={player.battingStyle} /></FormField>
          <FormField label="Bowling Style"><Input disabled value={player.bowlingStyle} /></FormField>
          <FormField label="Height"><Input disabled value={`${player.heightCm} cm`} /></FormField>
          <FormField label="Weight"><Input disabled value={`${player.weightKg} kg`} /></FormField>
          <FormField label="Current Fitness" hint="Derived from your latest Training Record."><Input disabled value={fitness} /></FormField>
          <FormField label="Assigned Coach"><Input disabled value={player.coach} /></FormField>
          <FormField label="Status"><div style={{ paddingTop: 6 }}><StatusBadge status={player.status} /></div></FormField>
        </div>
        <p className="text-faint" style={{ fontSize: 11.5, marginTop: 10, marginBottom: 0 }}>
          Height and weight are profile information only — they are never used as AI/ML prediction features.
        </p>
      </Card>
    </>
  );
}
