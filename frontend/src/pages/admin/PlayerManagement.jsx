import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { PLAYERS as INITIAL_PLAYERS, TRAINING_RECORDS_P001 } from '../../data/mockData.js';
import { PLAYER_ROLES } from '../../utils/cricket.js';
import { useToast } from '../../context/ToastContext.jsx';

// Current Fitness is DERIVED from the latest official Training Record, not
// stored redundantly on the profile (see docs decision from Phase 0/1).
function currentFitness(playerId) {
  if (playerId !== 'P001') return 'Not yet recorded';
  const withScore = [...TRAINING_RECORDS_P001].reverse().find((r) => r.fitnessScore != null);
  return withScore ? `${withScore.fitnessScore} / 100` : 'Not yet recorded';
}

export default function PlayerManagement() {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [modalPlayer, setModalPlayer] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const { showToast } = useToast();

  const filtered = useMemo(() => players.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesQuery && matchesRole;
  }), [players, query, roleFilter]);

  const save = (form) => {
    if (modalPlayer?.id) {
      setPlayers((list) => list.map((p) => (p.id === modalPlayer.id ? { ...p, ...form } : p)));
      showToast('Player profile updated (demo only).');
    } else {
      const id = `P${String(players.length + 1).padStart(3, '0')}`;
      setPlayers((list) => [...list, { id, status: 'Active', coach: 'Ravi Jayasinghe', ...form }]);
      showToast('Player profile created (demo only — linked Users row created in Phase 6).');
    }
    setModalPlayer(null);
  };

  const toggleStatus = (p) => {
    setPlayers((list) => list.map((x) => (x.id === p.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x)));
    setConfirmTarget(null);
  };

  return (
    <>
      <PageHeader title="Player Management" subtitle="Add, update and deactivate player profiles (FR2)" actions={<Button icon="person_add" onClick={() => setModalPlayer({})}>Add Player</Button>} />

      <div className="table-toolbar">
        <div className="table-search"><Icon name="search" /><Input placeholder="Search by name or ID…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="filter-row">
          {['All', ...PLAYER_ROLES].map((r) => (
            <Button key={r} size="sm" variant={roleFilter === r ? 'primary' : 'secondary'} onClick={() => setRoleFilter(r)}>{r}</Button>
          ))}
        </div>
      </div>

      <DataTable
        rows={filtered}
        rowKey="id"
        emptyTitle="No matching players"
        columns={[
          { key: 'id', header: 'ID', render: (p) => <span className="mono">{p.id}</span> },
          { key: 'name', header: 'Name' },
          { key: 'age', header: 'Age' },
          { key: 'role', header: 'Role' },
          { key: 'battingStyle', header: 'Batting Style' },
          { key: 'bowlingStyle', header: 'Bowling Style' },
          { key: 'fitness', header: 'Current Fitness', render: (p) => currentFitness(p.id) },
          { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          {
            key: 'actions', header: '',
            render: (p) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => setModalPlayer(p)}>Edit</Button>
                <Button size="sm" variant={p.status === 'Active' ? 'danger' : 'secondary'} icon={p.status === 'Active' ? 'block' : 'check_circle'} onClick={() => setConfirmTarget(p)}>
                  {p.status === 'Active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ),
          },
        ]}
      />

      <PlayerFormModal open={!!modalPlayer} initial={modalPlayer} onClose={() => setModalPlayer(null)} onSave={save} />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => toggleStatus(confirmTarget)}
        title={confirmTarget?.status === 'Active' ? 'Deactivate player?' : 'Activate player?'}
        message={confirmTarget && `${confirmTarget.name} will be marked ${confirmTarget.status === 'Active' ? 'Inactive' : 'Active'} (demo only).`}
        tone={confirmTarget?.status === 'Active' ? 'danger' : 'primary'}
      />
    </>
  );
}

function PlayerFormModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || '', age: initial?.age || '', role: initial?.role || PLAYER_ROLES[0],
        battingStyle: initial?.battingStyle || '', bowlingStyle: initial?.bowlingStyle || '',
        heightCm: initial?.heightCm || '', weightKg: initial?.weightKg || '',
      });
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Edit Player Profile' : 'Add Player Profile'}
      wide
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={() => onSave(form)} disabled={!form.name}>Save</Button>
      </>}
    >
      <div className="form-grid">
        <FormField label="Player Name" full><Input value={form.name} onChange={set('name')} placeholder="e.g. Nuwan Silva" /></FormField>
        <FormField label="Age"><Input type="number" min="12" max="19" value={form.age} onChange={set('age')} /></FormField>
        <FormField label="Role">
          <Select value={form.role} onChange={set('role')}>
            {PLAYER_ROLES.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </FormField>
        <FormField label="Batting Style"><Input value={form.battingStyle} onChange={set('battingStyle')} placeholder="e.g. Right-hand bat" /></FormField>
        <FormField label="Bowling Style"><Input value={form.bowlingStyle} onChange={set('bowlingStyle')} placeholder="e.g. Right-arm fast" /></FormField>
        <FormField label="Height (cm)"><Input type="number" value={form.heightCm} onChange={set('heightCm')} /></FormField>
        <FormField label="Weight (kg)"><Input type="number" value={form.weightKg} onChange={set('weightKg')} /></FormField>
        <FormField label="Current Fitness" full hint="Read-only — derived automatically from the latest Training Record once one exists. Not editable here.">
          <Input disabled value={initial?.id ? currentFitnessLabel(initial.id) : 'Not yet recorded'} />
        </FormField>
      </div>
      <p className="text-faint" style={{ fontSize: 11.5, marginTop: 4, marginBottom: 0 }}>
        Height and weight are profile information only — they are never used as AI/ML prediction features.
      </p>
    </Modal>
  );
}

function currentFitnessLabel(id) {
  if (id !== 'P001') return 'Not yet recorded';
  return '78 / 100';
}
