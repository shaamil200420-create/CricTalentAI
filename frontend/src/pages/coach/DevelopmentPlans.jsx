import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import Modal from '../../components/Modal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { FormField, Input, Select, Textarea } from '../../components/FormField.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

// Coach -> Development Plan now creates/edits real MySQL Development Plans
// (POST/PUT /development-plans) for an EXISTING real player (GET /players)
// — Player -> My Development Report reads these same rows.
export default function DevelopmentPlans() {
  const [players, setPlayers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm([]));

  const load = () => {
    setLoading(true);
    Promise.all([apiRequest('/players'), apiRequest('/development-plans')])
      .then(([playerList, planList]) => {
        setPlayers(playerList);
        setPlans(planList);
        setForm((f) => (f.playerId ? f : emptyForm(playerList)));
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => { setEditing(null); setForm(emptyForm(players)); setFormOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ playerId: p.playerId, focusArea: p.focusArea, objective: p.objective || '', startDate: p.startDate || '', targetDate: p.targetDate || '', progressPct: p.progressPct, notes: p.notes || '', status: p.status }); setFormOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/development-plans/${editing.id}`, {
          method: 'PUT',
          body: { focusArea: form.focusArea, objective: form.objective, startDate: form.startDate, targetDate: form.targetDate, progressPct: Number(form.progressPct), notes: form.notes, status: form.status },
        });
        showToast('Development plan updated.');
      } else {
        await apiRequest('/development-plans', {
          method: 'POST',
          body: { playerId: form.playerId, focusArea: form.focusArea, objective: form.objective, startDate: form.startDate, targetDate: form.targetDate, progressPct: Number(form.progressPct), notes: form.notes },
        });
        showToast('Development plan created.');
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
        title="Development Plan"
        subtitle="Individual player development plans — tracked separately from Goal Tracking"
        actions={<Button icon="add" onClick={openAdd} disabled={!players.length}>New Development Plan</Button>}
      />

      {loading ? (
        <Card><EmptyState icon="model_training" title="Loading development plans…" hint="Fetching plans from the database." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {plans.map((p) => {
            const player = players.find((x) => x.id === p.playerId);
            return (
              <Card key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5 }}>{p.focusArea}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{p.objective}</p>
                    <p className="text-faint mono" style={{ fontSize: 11, margin: '6px 0 0' }}>
                      {player?.name ?? p.playerId} · {p.startDate ? formatDate(p.startDate) : '—'} → {p.targetDate ? formatDate(p.targetDate) : '—'}
                    </p>
                    {p.notes && <p className="text-faint" style={{ fontSize: 12, marginTop: 6 }}>{p.notes}</p>}
                    <div style={{ marginTop: 10, maxWidth: 320 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                        <span className="text-faint">Progress</span><span className="mono">{p.progressPct}%</span>
                      </div>
                      <ProgressBar value={p.progressPct} />
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" icon="edit" onClick={() => openEdit(p)}>Edit</Button>
                </div>
              </Card>
            );
          })}
          {!plans.length && <Card><p className="text-faint" style={{ margin: 0, fontSize: 13 }}>No development plans yet.</p></Card>}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Development Plan' : 'New Development Plan'}
        wide
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
          <FormField label="Objective" full><Textarea rows={2} value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} /></FormField>
          <FormField label="Start Date"><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></FormField>
          <FormField label="Target Date"><Input type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} /></FormField>
          <FormField label="Progress %"><Input type="number" min="0" max="100" value={form.progressPct} onChange={(e) => setForm((f) => ({ ...f, progressPct: e.target.value }))} /></FormField>
          {editing && (
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option>Active</option>
                <option>Completed</option>
                <option>On Hold</option>
              </Select>
            </FormField>
          )}
          <FormField label="Notes" full><Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></FormField>
        </div>
      </Modal>
    </>
  );
}

function emptyForm(players) {
  return { playerId: players[0]?.id || '', focusArea: '', objective: '', startDate: '', targetDate: '', progressPct: 0, notes: '', status: 'Active' };
}
