import { useEffect, useState } from 'react';
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
import { PLAYERS } from '../../data/mockData.js';
import { COACH_SPECIALIZATIONS } from '../../utils/cricket.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

// "Assigned Players" is a frontend-only grouping (not part of this task's
// backend scope — see Coach Management's action list) so it's kept as
// local-only state layered on top of the real account fields below.
export default function CoachManagement() {
  const [coaches, setCoaches] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest('/admin/coaches')
      .then((rows) => setCoaches(rows.map((c) => ({ ...c, assignedPlayers: [] }))))
      .catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); setFormOpen(true); };

  const save = async (form) => {
    try {
      if (editing) {
        const updated = await apiRequest(`/admin/coaches/${editing.id}`, {
          method: 'PUT',
          body: { name: form.name, phone: form.phone, specialization: form.specialization, status: form.status, newPassword: form.password || undefined },
        });
        setCoaches((list) => list.map((c) => (c.id === editing.id ? { ...updated, assignedPlayers: c.assignedPlayers } : c)));
        showToast('Coach profile updated.');
      } else {
        const created = await apiRequest('/admin/coaches', {
          method: 'POST',
          body: { name: form.name, username: form.username, phone: form.phone, specialization: form.specialization, password: form.password },
        });
        setCoaches((list) => [...list, { ...created, assignedPlayers: [] }]);
        showToast('Coach account created.');
      }
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleStatus = async (c) => {
    try {
      const nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
      const updated = await apiRequest(`/admin/coaches/${c.id}/status`, { method: 'PATCH', body: { status: nextStatus } });
      setCoaches((list) => list.map((x) => (x.id === c.id ? { ...updated, assignedPlayers: x.assignedPlayers } : x)));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmTarget(null);
    }
  };

  const deleteCoach = async (c) => {
    try {
      await apiRequest(`/admin/coaches/${c.id}`, { method: 'DELETE' });
      setCoaches((list) => list.filter((x) => x.id !== c.id));
      showToast('Coach account deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const togglePlayer = (playerId) => {
    setCoaches((list) => list.map((c) => {
      if (c.id !== assignTarget.id) return c;
      const has = c.assignedPlayers.includes(playerId);
      return { ...c, assignedPlayers: has ? c.assignedPlayers.filter((id) => id !== playerId) : [...c.assignedPlayers, playerId] };
    }));
  };

  return (
    <div className="admin-legacy">
      <Card className="legacy-page-card">
        <PageHeader title="Coach Management" subtitle="View and manage all academy coaches" actions={<Button icon="person_add" onClick={openAdd}>Add Coach</Button>} />

        <DataTable
          rows={coaches}
          emptyTitle="No coaches yet"
          columns={[
            { key: 'name', header: 'Coach', render: (c) => <PersonRow name={c.name} /> },
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
                  <button type="button" className="icon-btn" title="View Coach" onClick={() => setViewTarget(c)}><Icon name="visibility" size={18} /></button>
                  <button type="button" className="icon-btn" title="Assigned Players" onClick={() => setAssignTarget(c)}><Icon name="groups" size={18} /></button>
                  <button type="button" className="icon-btn" title="Edit Coach" onClick={() => openEdit(c)}><Icon name="edit" size={18} /></button>
                  <button type="button" className="icon-btn" title={c.status === 'Active' ? 'Deactivate Coach' : 'Activate Coach'} onClick={() => setConfirmTarget(c)}>
                    <Icon name={c.status === 'Active' ? 'person_off' : 'check_circle'} size={18} />
                  </button>
                  <button type="button" className="icon-btn" title="Delete Coach Permanently" onClick={() => setDeleteTarget(c)}>
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <CoachFormModal open={formOpen} initial={editing} onClose={() => setFormOpen(false)} onSave={save} />

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.name}
        subtitle="Read-only coach profile"
        footer={<Button variant="secondary" onClick={() => setViewTarget(null)}>Close</Button>}
      >
        {viewTarget && (
          <>
            <div className="legacy-view-divider" />
            <div className="form-grid">
              <FormField label="Coach ID"><Input value={viewTarget.id} disabled readOnly /></FormField>
              <FormField label="Username"><Input value={viewTarget.username} disabled readOnly /></FormField>
              <FormField label="Phone"><Input value={viewTarget.phone} disabled readOnly /></FormField>
              <FormField label="Specialization"><Input value={viewTarget.specialization} disabled readOnly /></FormField>
              <FormField label="Assigned Players"><Input value={`${viewTarget.assignedPlayers.length} of ${PLAYERS.length}`} disabled readOnly /></FormField>
              <FormField label="Since"><Input value={viewTarget.since} disabled readOnly /></FormField>
              <FormField label="Status"><Input value={viewTarget.status} disabled readOnly /></FormField>
            </div>
          </>
        )}
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
        message={confirmTarget && `${confirmTarget.name} will be marked ${confirmTarget.status === 'Active' ? 'Inactive' : 'Active'}.`}
        confirmLabel={confirmTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        tone={confirmTarget?.status === 'Active' ? 'danger' : 'primary'}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteCoach(deleteTarget)}
        title="Delete coach permanently?"
        message={deleteTarget && `${deleteTarget.name}'s account and login will be permanently removed from the database. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}

function CoachFormModal({ open, initial, onClose, onSave }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [status, setStatus] = useState('Active');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setUsername(initial?.username || '');
      setPhone(initial?.phone || '');
      setSpecialization(initial?.specialization || '');
      setStatus(initial?.status || 'Active');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [open, initial]);

  const isEdit = !!initial?.id;

  const submit = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!username.trim()) errs.username = 'Username is required.';
    if (!phone.trim()) errs.phone = 'Phone number is required.';

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
    onSave({ name, username, phone, specialization, status, password });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Coach' : 'Add New Coach'}
      subtitle={isEdit ? undefined : 'Create a coach login account in one step.'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={submit}>{isEdit ? 'Save Changes' : 'Save Coach'}</Button>
      </>}
    >
      <div className="form-grid">
        <div className="form-section-label">Coach Profile</div>
        <FormField label="Full Name" full error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ravi Jayasinghe" /></FormField>
        <FormField label="Username" error={errors.username}><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. ravi.j" /></FormField>
        <FormField label="Phone" error={errors.phone}><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +94 71 234 5678" /></FormField>
        <FormField label="Specialization" full>
          <Select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
            <option value="" disabled>Select a specialization…</option>
            {specialization && !COACH_SPECIALIZATIONS.includes(specialization) && (
              <option value={specialization}>{specialization}</option>
            )}
            {COACH_SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </FormField>

        {!isEdit && (
          <>
            <div className="form-section-label">Login Credentials</div>
            <FormField label="Password" error={errors.password}>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set password" autoComplete="new-password" error={errors.password} />
            </FormField>
            <FormField label="Confirm Password" error={errors.confirmPassword}>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" error={errors.confirmPassword} />
            </FormField>
          </>
        )}

        {isEdit && (
          <>
            <FormField label="Status" full>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
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
    </Modal>
  );
}
