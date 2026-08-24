import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import Modal from '../../components/Modal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

// Coach -> Goal Tracking now creates/edits real MySQL Goals (POST/PUT
// /goals) for an EXISTING real player (GET /players — the same shared
// Player Directory Match Entry/Training Entry use, never a separate mock
// list) — Player -> My Goals reads these same rows. No delete affordance,
// matching the pre-existing design.
export default function Goals() {
  const [players, setPlayers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm([]));

  const load = () => {
    setLoading(true);
    Promise.all([apiRequest('/players'), apiRequest('/goals')])
      .then(([playerList, goalList]) => {
        setPlayers(playerList);
        setGoals(goalList);
        setForm((f) => (f.playerId ? f : emptyForm(playerList)));
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => { setEditing(null); setForm(emptyForm(players)); setFormOpen(true); };
  const openEdit = (g) => { setEditing(g); setForm({ playerId: g.playerId, focusArea: g.focusArea, target: g.target || '', deadline: g.deadline || '', progressPct: g.progressPct, status: g.status }); setFormOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/goals/${editing.id}`, {
          method: 'PUT',
          body: { focusArea: form.focusArea, target: form.target, deadline: form.deadline, progressPct: Number(form.progressPct), status: form.status },
        });
        showToast('Goal updated.');
      } else {
        await apiRequest('/goals', {
          method: 'POST',
          body: { playerId: form.playerId, focusArea: form.focusArea, target: form.target, deadline: form.deadline, progressPct: Number(form.progressPct), status: form.status },
        });
        showToast('Goal created.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Goal Tracking"
        subtitle="Short-term player goals — tracked separately from the Development Plan"
        actions={<Button icon="flag" onClick={openAdd} disabled={!players.length}>New Goal</Button>}
      />

      {loading ? (
        <Card><EmptyState icon="flag" title="Loading goals…" hint="Fetching goals from the database." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {goals.map((g) => {
            const player = players.find((x) => x.id === g.playerId);
            return (
              <Card key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5 }}>{g.focusArea}</span>
                      <StatusBadge status={g.status} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{g.target}</p>
                    <p className="text-faint mono" style={{ fontSize: 11, margin: '6px 0 0' }}>{player?.name ?? g.playerId} · {g.deadline ? `deadline ${formatDate(g.deadline)}` : 'no deadline'}</p>
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
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Goal' : 'New Goal'}
        footer={<>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" icon="save" onClick={save} disabled={!form.focusArea || saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>}
      >
        <div className="form-grid">
          <FormField label="Player">
            <Select value={form.playerId} disabled={!!editing} onChange={(e) => setForm((f) => ({ ...f, playerId: e.target.value }))}>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
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

function emptyForm(players) {
  return { playerId: players[0]?.id || '', focusArea: '', target: '', deadline: '', progressPct: 0, status: 'In Progress' };
}
