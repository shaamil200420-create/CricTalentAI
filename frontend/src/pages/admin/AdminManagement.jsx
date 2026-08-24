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
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest('/admin/admins').then(setAdmins).catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a) => { setEditing(a); setFormOpen(true); };

  const saveAdmin = async (form) => {
    try {
      if (editing) {
        const updated = await apiRequest(`/admin/admins/${editing.id}`, {
          method: 'PUT',
          body: { name: form.name, email: form.email, phone: form.phone, status: form.status, newPassword: form.password || undefined },
        });
        setAdmins((list) => list.map((a) => (a.id === editing.id ? updated : a)));
        showToast('Administrator profile updated.');
      } else {
        const created = await apiRequest('/admin/admins', {
          method: 'POST',
          body: { name: form.name, username: form.username, email: form.email, phone: form.phone, password: form.password },
        });
        setAdmins((list) => [...list, created]);
        showToast('Administrator account created.');
      }
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleStatus = async (a) => {
    try {
      const nextStatus = a.status === 'Active' ? 'Inactive' : 'Active';
      const updated = await apiRequest(`/admin/admins/${a.id}/status`, { method: 'PATCH', body: { status: nextStatus } });
      setAdmins((list) => list.map((x) => (x.id === a.id ? updated : x)));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmTarget(null);
    }
  };

  const deleteAdmin = async (a) => {
    try {
      await apiRequest(`/admin/admins/${a.id}`, { method: 'DELETE' });
      setAdmins((list) => list.filter((x) => x.id !== a.id));
      showToast('Administrator account deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="admin-legacy">
      <Card className="legacy-page-card">
        <PageHeader
          title="Admin Management"
          subtitle="View and manage administrator accounts"
          actions={<Button icon="person_add" onClick={openAdd}>Add Admin</Button>}
        />

        <DataTable
          rows={admins}
          emptyTitle="No administrator accounts yet"
          columns={[
            { key: 'name', header: 'Name', render: (a) => <PersonRow name={a.name} /> },
            { key: 'username', header: 'Username', render: (a) => <span className="mono">{a.username}</span> },
            { key: 'email', header: 'Email' },
            { key: 'phone', header: 'Phone' },
            { key: 'since', header: 'Since' },
            { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
            {
              key: 'actions', header: '',
              render: (a) => (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button type="button" className="icon-btn" title="View Admin" onClick={() => setViewTarget(a)}><Icon name="visibility" size={18} /></button>
                  <button type="button" className="icon-btn" title="Edit Admin" onClick={() => openEdit(a)}><Icon name="edit" size={18} /></button>
                  <button type="button" className="icon-btn" title={a.status === 'Active' ? 'Deactivate Admin' : 'Activate Admin'} onClick={() => setConfirmTarget(a)}>
                    <Icon name={a.status === 'Active' ? 'person_off' : 'check_circle'} size={18} />
                  </button>
                  <button type="button" className="icon-btn" title="Delete Admin Permanently" onClick={() => setDeleteTarget(a)}>
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <AdminFormModal open={formOpen} initial={editing} onClose={() => setFormOpen(false)} onSave={saveAdmin} />

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.name}
        subtitle="Read-only administrator account information"
        footer={<Button variant="secondary" onClick={() => setViewTarget(null)}>Close</Button>}
      >
        {viewTarget && (
          <>
            <div className="legacy-view-divider" />
            <div className="form-grid">
              <FormField label="Admin Name"><Input value={viewTarget.name} disabled readOnly /></FormField>
              <FormField label="Username"><Input value={viewTarget.username} disabled readOnly /></FormField>
              <FormField label="Email"><Input value={viewTarget.email} disabled readOnly /></FormField>
              <FormField label="Phone"><Input value={viewTarget.phone} disabled readOnly /></FormField>
              <FormField label="Since"><Input value={viewTarget.since} disabled readOnly /></FormField>
              <FormField label="Status"><Input value={viewTarget.status} disabled readOnly /></FormField>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => toggleStatus(confirmTarget)}
        title={confirmTarget?.status === 'Active' ? 'Deactivate admin?' : 'Activate admin?'}
        message={confirmTarget && `${confirmTarget.name} will be marked ${confirmTarget.status === 'Active' ? 'Inactive' : 'Active'}.`}
        confirmLabel={confirmTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        tone={confirmTarget?.status === 'Active' ? 'danger' : 'primary'}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteAdmin(deleteTarget)}
        title="Delete admin permanently?"
        message={deleteTarget && `${deleteTarget.name}'s account and login will be permanently removed from the database. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}

function AdminFormModal({ open, initial, onClose, onSave }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setUsername(initial?.username || '');
      setEmail(initial?.email || '');
      setPhone(initial?.phone || '');
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
    if (!email.trim()) errs.email = 'Email is required.';
    if (!phone.trim()) errs.phone = 'Phone number is required.';

    // A new administrator account sets its own login password here (old
    // admin (4).html "Login Credentials" pattern). Editing an existing
    // profile resets the password only if a new one is entered — leaving
    // both password fields blank keeps the current password unchanged.
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
    onSave({ name, username, email, phone, status, password });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Admin' : 'Add New Admin'}
      subtitle={isEdit ? undefined : 'Create an administrator login account in one step.'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={submit}>{isEdit ? 'Save Changes' : 'Save Admin'}</Button>
      </>}
    >
      <div className="form-grid">
        <div className="form-section-label">Administrator Profile</div>
        <FormField label="Admin Name" full error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kasun Rajapaksha" /></FormField>
        <FormField label="Username" error={errors.username}><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. admin.kasun" /></FormField>
        <FormField label="Email" error={errors.email}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. kasun@academy.lk" /></FormField>
        <FormField label="Phone Number" error={errors.phone}><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +94 71 200 1122" /></FormField>

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
