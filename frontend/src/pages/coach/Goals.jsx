import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import Modal from '../../components/Modal.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { PLAYERS, GOALS_P001 as INITIAL_GOALS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Goals() {
  const [goals, setGoals] = useState(INITIAL_GOALS.map((g) => ({ playerId: 'P001', ...g })));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm());

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (g) => { setEditing(g); setForm({ playerId: g.playerId, focusArea: g.focusArea, target: g.target, deadline: g.deadline, progressPct: g.progressPct, status: g.status }); setFormOpen(true); };

  const save = () => {
    if (editing) {
      setGoals((list) => list.map((g) => (g.id === editing.id ? { ...g, ...form, progressPct: Number(form.progressPct) } : g)));
      showToast('Goal updated (demo only).');
    } else {
      setGoals((list) => [...list, { id: `G${String(list.length + 1).padStart(3, '0')}`, ...form, progressPct: Number(form.progressPct) }]);
      showToast('Goal created (demo only).');
    }
    setFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Goal Tracking"
        subtitle="Short-term player goals — tracked separately from the Development Plan (FR15)"
        actions={<Button icon="flag" onClick={openAdd}>New Goal</Button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goals.map((g) => {
          const player = PLAYERS.find((x) => x.id === g.playerId);
          return (
            <Card key={g.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{g.focusArea}</span>
                    <StatusBadge status={g.status} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{g.target}</p>
                  <p className="text-faint mono" style={{ fontSize: 11, margin: '6px 0 0' }}>{player?.name} · deadline {formatDate(g.deadline)}</p>
                  <div style={{ marginTop: 10, maxWidth: 320 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span className="text-faint">Progress</span><span className="mono">{g.progressPct}%</span>
                    </div>
                    <ProgressBar value={g.progressPct} />
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => openEdit(g)}>Edit</Button>
              </div>
            </Card>
          );
        })}
        {!goals.length && <Card><p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No goals set yet.</p></Card>}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Goal' : 'New Goal'}
        footer={<>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" icon="save" onClick={save} disabled={!form.focusArea}>Save</Button>
        </>}
      >
        <div className="form-grid">
          <FormField label="Player">
            <Select value={form.playerId} onChange={(e) => setForm((f) => ({ ...f, playerId: e.target.value }))}>
              {PLAYERS.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </Select>
          </FormField>
          <FormField label="Focus Area"><Input value={form.focusArea} onChange={(e) => setForm((f) => ({ ...f, focusArea: e.target.value }))} /></FormField>
          <FormField label="Target" full><Input value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} /></FormField>
          <FormField label="Deadline"><Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} /></FormField>
          <FormField label="Progress %"><Input type="number" min="0" max="100" value={form.progressPct} onChange={(e) => setForm((f) => ({ ...f, progressPct: e.target.value }))} /></FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option>In Progress</option>
              <option>Achieved</option>
              <option>Missed</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </>
  );
}

function emptyForm() {
  return { playerId: PLAYERS[0].id, focusArea: '', target: '', deadline: '', progressPct: 0, status: 'In Progress' };
}
