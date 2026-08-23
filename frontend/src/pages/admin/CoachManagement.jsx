import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { FormField, Input } from '../../components/FormField.jsx';
import { COACHES as INITIAL_COACHES, PLAYERS } from '../../data/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function CoachManagement() {
  const [coaches, setCoaches] = useState(INITIAL_COACHES);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');

  const openAdd = () => { setEditing(null); setName(''); setPhone(''); setSpecialization(''); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); setName(c.name); setPhone(c.phone); setSpecialization(c.specialization); setFormOpen(true); };

  const save = () => {
    if (editing) {
      setCoaches((list) => list.map((c) => (c.id === editing.id ? { ...c, name, phone, specialization } : c)));
      showToast('Coach profile updated (demo only).');
    } else {
      setCoaches((list) => [...list, {
        id: `C${String(list.length + 1).padStart(3, '0')}`, name, username: name.split(' ')[0].toLowerCase(),
        phone, specialization, since: new Date().toISOString().slice(0, 10), status: 'Active', assignedPlayers: [],
      }]);
      showToast('Coach account created (demo only — linked Users row created in Phase 6).');
    }
    setFormOpen(false);
  };

  const toggleStatus = (c) => {
    setCoaches((list) => list.map((x) => (x.id === c.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x)));
    setConfirmTarget(null);
  };

  const togglePlayer = (playerId) => {
    setCoaches((list) => list.map((c) => {
      if (c.id !== assignTarget.id) return c;
      const has = c.assignedPlayers.includes(playerId);
      return { ...c, assignedPlayers: has ? c.assignedPlayers.filter((id) => id !== playerId) : [...c.assignedPlayers, playerId] };
    }));
  };

  return (
    <>
      <PageHeader title="Coach Management" subtitle="View and manage all academy coaches" actions={<Button icon="person_add" onClick={openAdd}>Add Coach</Button>} />

      <DataTable
        rows={coaches}
        emptyTitle="No coaches yet"
        columns={[
          { key: 'name', header: 'Coach' },
          { key: 'username', header: 'Username', render: (c) => <span className="mono">{c.username}</span> },
          { key: 'phone', header: 'Phone' },
          { key: 'specialization', header: 'Specialization' },
          { key: 'assigned', header: 'Assigned Players', render: (c) => `${c.assignedPlayers.length} of ${PLAYERS.length}` },
          { key: 'since', header: 'Since' },
          { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
          {
            key: 'actions', header: '',
            render: (c) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary" icon="groups" onClick={() => setAssignTarget(c)}>Players</Button>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => openEdit(c)}>Edit</Button>
                <Button size="sm" variant={c.status === 'Active' ? 'danger' : 'secondary'} icon={c.status === 'Active' ? 'block' : 'check_circle'} onClick={() => setConfirmTarget(c)}>
                  {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Coach' : 'Add Coach'}
        footer={<>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" icon="save" onClick={save} disabled={!name}>Save</Button>
        </>}
      >
        <div className="form-grid">
          <FormField label="Full Name" full><Input value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></FormField>
          <FormField label="Specialization"><Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} /></FormField>
        </div>
      </Modal>

      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Assigned Players — ${assignTarget?.name ?? ''}`}
        subtitle="Coach ↔ Player group assignment. Stored later as the coach_players table (Phase 3)."
        footer={<Button variant="primary" onClick={() => setAssignTarget(null)}>Done</Button>}
      >
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PLAYERS.map((p) => {
            const checked = assignTarget?.assignedPlayers.includes(p.id);
            return (
              <li key={p.id}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!checked} onChange={() => togglePlayer(p.id)} />
                  <span style={{ fontSize: 13.5 }}>{p.name}</span>
                  <span className="text-faint mono" style={{ fontSize: 11 }}>{p.id} · {p.role}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => toggleStatus(confirmTarget)}
        title={confirmTarget?.status === 'Active' ? 'Deactivate coach?' : 'Activate coach?'}
        message={confirmTarget && `${confirmTarget.name} will be marked ${confirmTarget.status === 'Active' ? 'Inactive' : 'Active'} (demo only).`}
        tone={confirmTarget?.status === 'Active' ? 'danger' : 'primary'}
      />
    </>
  );
}
