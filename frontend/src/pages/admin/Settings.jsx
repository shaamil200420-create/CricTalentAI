import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const ACCESS_MATRIX = [
  { module: 'User / Admin / Coach / Player Management', admin: true, coach: false, player: false },
  { module: 'Tournament & Schedule Management', admin: true, coach: false, player: false },
  { module: 'Match Entry / Training Entry', admin: false, coach: true, player: false },
  { module: 'Player Comparison', admin: false, coach: true, player: false },
  { module: 'AI Prediction View & Recommendation Review', admin: false, coach: true, player: false },
  { module: 'Development Plan & Goal Tracking (create/update)', admin: false, coach: true, player: false },
  { module: 'Coach Feedback (write)', admin: false, coach: true, player: false },
  { module: 'My Profile / My Stats / My Schedule (view only)', admin: false, coach: false, player: true },
  { module: 'My Goals / My Feedback / My Development Report (view only)', admin: false, coach: false, player: true },
  { module: 'Reports (view/generate)', admin: true, coach: true, player: false },
];

export default function Settings() {
  const { showToast } = useToast();
  const [academyName, setAcademyName] = useState('CricTalentAI Academy');
  const [season, setSeason] = useState('2026 U19 T20 Season');
  const [timezone, setTimezone] = useState('Asia/Colombo');
  const [notifyAlerts, setNotifyAlerts] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [notes, setNotes] = useState('');

  const saveProfile = () => showToast('Academy profile saved (demo only — persisted to MySQL in a later phase).');
  const saveNotifications = () => showToast('Notification preferences saved (demo only).');

  return (
    <>
      <PageHeader title="Settings" subtitle="Academy profile, notification preferences and role access overview" />

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1.1fr 0.9fr', alignItems: 'start' }}>
        <Card title="Academy Profile">
          <div className="form-grid">
            <FormField label="Academy Name" full><Input value={academyName} onChange={(e) => setAcademyName(e.target.value)} /></FormField>
            <FormField label="Current Season"><Input value={season} onChange={(e) => setSeason(e.target.value)} /></FormField>
            <FormField label="Timezone">
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Asia/Colombo">Asia/Colombo</option>
                <option value="UTC">UTC</option>
              </Select>
            </FormField>
            <FormField label="Notes" full><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional internal notes about this season…" /></FormField>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button variant="primary" icon="save" onClick={saveProfile}>Save Academy Profile</Button>
          </div>
        </Card>

        <Card title="Appearance">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Theme</p>
              <p className="text-faint" style={{ margin: '2px 0 0', fontSize: 12 }}>Applies across every portal on this device.</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        <Card title="Notification Preferences" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={notifyAlerts} onChange={(e) => setNotifyAlerts(e.target.checked)} />
              <span style={{ fontSize: 13.5 }}>Notify me about new performance alerts</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={notifyDigest} onChange={(e) => setNotifyDigest(e.target.checked)} />
              <span style={{ fontSize: 13.5 }}>Send a weekly summary digest</span>
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" icon="save" onClick={saveNotifications}>Save Preferences</Button>
          </div>
        </Card>

        <Card title="Role Access Overview" subtitle="Read-only. Real enforcement (RBAC + JWT) arrives in Phase 5." style={{ gridColumn: '1 / -1' }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Module</th><th style={{ textAlign: 'center' }}>Admin</th><th style={{ textAlign: 'center' }}>Coach</th><th style={{ textAlign: 'center' }}>Player</th></tr>
              </thead>
              <tbody>
                {ACCESS_MATRIX.map((row) => (
                  <tr key={row.module}>
                    <td>{row.module}</td>
                    <td style={{ textAlign: 'center' }}>{row.admin ? <Badge tone="primary">Yes</Badge> : <span className="text-faint">—</span>}</td>
                    <td style={{ textAlign: 'center' }}>{row.coach ? <Badge tone="info">Yes</Badge> : <span className="text-faint">—</span>}</td>
                    <td style={{ textAlign: 'center' }}>{row.player ? <Badge tone="cyan">Yes</Badge> : <span className="text-faint">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
