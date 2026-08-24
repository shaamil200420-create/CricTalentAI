import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { PersonRow } from '../../components/InitialAvatar.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { PLAYER_ROLES, BATTING_STYLES, BOWLING_STYLES } from '../../utils/cricket.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

export default function PlayerManagement() {
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [modalPlayer, setModalPlayer] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [fitnessByPlayer, setFitnessByPlayer] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest('/admin/players').then(setPlayers).catch((err) => showToast(err.message, 'error'));

    // Current Fitness is DERIVED from each player's latest real MySQL
    // Training Record (fitness_score), not stored redundantly on the
    // profile. GET /training-records returns every record ordered by id
    // ascending, so the last entry per player is their most recent one.
    apiRequest('/training-records')
      .then((records) => {
        const latest = {};
        records.forEach((r) => { if (r.fitnessScore != null) latest[r.playerId] = r.fitnessScore; });
        setFitnessByPlayer(latest);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentFitness = (playerId) => (
    fitnessByPlayer[playerId] != null ? `${fitnessByPlayer[playerId]} / 100` : 'Not yet recorded'
  );

  const filtered = useMemo(() => players.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesQuery && matchesRole;
  }), [players, query, roleFilter]);

  const save = async (form) => {
    try {
      if (modalPlayer?.id) {
        const updated = await apiRequest(`/admin/players/${modalPlayer.id}`, {
          method: 'PUT',
          body: {
            name: form.name, age: form.age ? Number(form.age) : undefined, role: form.role,
            battingStyle: form.battingStyle, bowlingStyle: form.bowlingStyle,
            heightCm: form.heightCm ? Number(form.heightCm) : undefined, weightKg: form.weightKg ? Number(form.weightKg) : undefined,
            status: form.status, newPassword: form.password || undefined,
          },
        });
        setPlayers((list) => list.map((p) => (p.id === modalPlayer.id ? updated : p)));
        showToast('Player profile updated.');
      } else {
        const created = await apiRequest('/admin/players', {
          method: 'POST',
          body: {
            username: form.username, password: form.password, name: form.name,
            age: form.age ? Number(form.age) : undefined, role: form.role,
            battingStyle: form.battingStyle, bowlingStyle: form.bowlingStyle,
            heightCm: form.heightCm ? Number(form.heightCm) : undefined, weightKg: form.weightKg ? Number(form.weightKg) : undefined,
          },
        });
        setPlayers((list) => [...list, created]);
        showToast('Player profile created.');
      }
      setModalPlayer(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleStatus = async (p) => {
    try {
      const nextStatus = p.status === 'Active' ? 'Inactive' : 'Active';
      const updated = await apiRequest(`/admin/players/${p.id}/status`, { method: 'PATCH', body: { status: nextStatus } });
      setPlayers((list) => list.map((x) => (x.id === p.id ? updated : x)));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmTarget(null);
    }
  };

  const deletePlayer = async (p) => {
    try {
      await apiRequest(`/admin/players/${p.id}`, { method: 'DELETE' });
      setPlayers((list) => list.filter((x) => x.id !== p.id));
      showToast('Player profile deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="admin-legacy">
      <Card className="legacy-page-card">
        <PageHeader title="Player Management" subtitle="Add, update and deactivate player profiles (FR2)" actions={<Button icon="person_add" onClick={() => setModalPlayer({})}>Add Player</Button>} />

        <div className="table-toolbar">
          <div className="table-search"><Icon name="search" size={18} /><Input placeholder="Search by name or ID…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
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
            { key: 'name', header: 'Name', render: (p) => <PersonRow name={p.name} /> },
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
                  <button type="button" className="icon-btn" title="View Player" onClick={() => setViewTarget(p)}><Icon name="visibility" size={18} /></button>
                  <button type="button" className="icon-btn" title="Edit Player" onClick={() => setModalPlayer(p)}><Icon name="edit" size={18} /></button>
                  <button type="button" className="icon-btn" title={p.status === 'Active' ? 'Deactivate Player' : 'Activate Player'} onClick={() => setConfirmTarget(p)}>
                    <Icon name={p.status === 'Active' ? 'person_off' : 'check_circle'} size={18} />
                  </button>
                  <button type="button" className="icon-btn" title="Delete Player Permanently" onClick={() => setDeleteTarget(p)}>
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <PlayerFormModal
        open={!!modalPlayer}
        initial={modalPlayer}
        onClose={() => setModalPlayer(null)}
        onSave={save}
        currentFitnessValue={modalPlayer?.id ? currentFitness(modalPlayer.id) : 'Not yet recorded'}
      />

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.name}
        subtitle="Read-only player profile"
        footer={<Button variant="secondary" onClick={() => setViewTarget(null)}>Close</Button>}
      >
        {viewTarget && (
          <>
            <div className="legacy-view-divider" />
            <div className="form-grid">
              <FormField label="Player ID"><Input value={viewTarget.id} disabled readOnly /></FormField>
              <FormField label="Age"><Input value={viewTarget.age} disabled readOnly /></FormField>
              <FormField label="Role"><Input value={viewTarget.role} disabled readOnly /></FormField>
              <FormField label="Batting Style"><Input value={viewTarget.battingStyle} disabled readOnly /></FormField>
              <FormField label="Bowling Style"><Input value={viewTarget.bowlingStyle} disabled readOnly /></FormField>
              <FormField label="Height"><Input value={viewTarget.heightCm ? `${viewTarget.heightCm} cm` : '—'} disabled readOnly /></FormField>
              <FormField label="Weight"><Input value={viewTarget.weightKg ? `${viewTarget.weightKg} kg` : '—'} disabled readOnly /></FormField>
              <FormField label="Current Fitness"><Input value={currentFitness(viewTarget.id)} disabled readOnly /></FormField>
              <FormField label="Assigned Coach"><Input value={viewTarget.coach ?? '—'} disabled readOnly /></FormField>
              <FormField label="Status"><Input value={viewTarget.status} disabled readOnly /></FormField>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => toggleStatus(confirmTarget)}
        title={confirmTarget?.status === 'Active' ? 'Deactivate player?' : 'Activate player?'}
        message={confirmTarget && `${confirmTarget.name} will be marked ${confirmTarget.status === 'Active' ? 'Inactive' : 'Active'}.`}
        confirmLabel={confirmTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        tone={confirmTarget?.status === 'Active' ? 'danger' : 'primary'}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deletePlayer(deleteTarget)}
        title="Delete player permanently?"
        message={deleteTarget && `${deleteTarget.name}'s profile, account and login will be permanently removed from the database. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}

function PlayerFormModal({ open, initial, onClose, onSave, currentFitnessValue }) {
  const [form, setForm] = useState({});
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || '', age: initial?.age || '', role: initial?.role || PLAYER_ROLES[0],
        battingStyle: initial?.battingStyle || '', bowlingStyle: initial?.bowlingStyle || '',
        heightCm: initial?.heightCm || '', weightKg: initial?.weightKg || '', status: initial?.status || 'Active',
      });
      setUsername(initial?.username || '');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isEdit = !!initial?.id;

  const submit = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Player name is required.';
    if (!username.trim()) errs.username = 'Username is required.';

    if (!isEdit) {
      if (!password) errs.password = 'Password is required.';
      if (!confirmPassword) errs.confirmPassword = 'Please confirm the password.';
      if (!errs.password && !errs.confirmPassword && password !== confirmPassword) {
        errs.confirmPassword = 'Password and confirmation do not match.';
      }
    } else if (password || confirmPassword) {
      if (!password) errs.password = 'Enter a new password, or leave both password fields blank.';
      if (!confirmPassword) errs.confirmPassword = 'Please confirm the new password.';
      else if (!errs.password && password !== confirmPassword) errs.confirmPassword = 'Password and confirmation do not match.';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({ ...form, username, password });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Player Profile' : 'Add Player Profile'}
      wide
      subtitle={isEdit ? undefined : 'Create the player\'s login account and profile in one step.'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={submit}>{isEdit ? 'Save Changes' : 'Save Player'}</Button>
      </>}
    >
      <div className="form-grid">
        <div className="form-section-label">Login / Account Details</div>
        <FormField label="Username" error={errors.username}><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. nuwan.p002" /></FormField>
        {!isEdit && <div />}
        {!isEdit && (
          <>
            <FormField label="Password" error={errors.password}>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set password" autoComplete="new-password" error={errors.password} />
            </FormField>
            <FormField label="Confirm Password" error={errors.confirmPassword}>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" error={errors.confirmPassword} />
            </FormField>
          </>
        )}

        <div className="form-section-label">Player Profile</div>
        <FormField label="Player Name" full error={errors.name}><Input value={form.name} onChange={set('name')} placeholder="e.g. Nuwan Silva" /></FormField>
        <FormField label="Age"><Input type="number" min="12" max="19" value={form.age} onChange={set('age')} /></FormField>
        <FormField label="Role">
          <Select value={form.role} onChange={set('role')}>
            {PLAYER_ROLES.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </FormField>
        <FormField label="Batting Style">
          <Select value={form.battingStyle} onChange={set('battingStyle')}>
            <option value="" disabled>Select…</option>
            {form.battingStyle && !BATTING_STYLES.includes(form.battingStyle) && (
              <option value={form.battingStyle}>{form.battingStyle}</option>
            )}
            {BATTING_STYLES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Bowling Style">
          <Select value={form.bowlingStyle} onChange={set('bowlingStyle')}>
            <option value="" disabled>Select…</option>
            {form.bowlingStyle && !BOWLING_STYLES.includes(form.bowlingStyle) && (
              <option value={form.bowlingStyle}>{form.bowlingStyle}</option>
            )}
            {BOWLING_STYLES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Height (cm)"><Input type="number" value={form.heightCm} onChange={set('heightCm')} /></FormField>
        <FormField label="Weight (kg)"><Input type="number" value={form.weightKg} onChange={set('weightKg')} /></FormField>
        <FormField label="Current Fitness" full hint="Read-only — derived automatically from the latest Training Record once one exists. Not editable here.">
          <Input disabled value={currentFitnessValue} />
        </FormField>

        {isEdit && (
          <>
            <FormField label="Status" full>
              <Select value={form.status} onChange={set('status')}>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </FormField>
            <FormField label="New Password (Optional)" error={errors.password}>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Blank keeps current password" autoComplete="new-password" error={errors.password} />
            </FormField>
            <FormField label="Confirm New Password" error={errors.confirmPassword}>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" autoComplete="new-password" error={errors.confirmPassword} />
            </FormField>
          </>
        )}
      </div>
      <p className="text-faint" style={{ fontSize: 11.5, marginTop: 4, marginBottom: 0 }}>
        Height and weight are profile information only — they are never used as AI/ML prediction features.
      </p>
    </Modal>
  );
}
