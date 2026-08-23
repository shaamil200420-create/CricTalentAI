import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge, Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { USERS as INITIAL_USERS } from '../../data/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

const ROLE_TONE = { Admin: 'error', Coach: 'info', Player: 'primary' };

export default function UserManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [modalUser, setModalUser] = useState(null); // { } = add, {...} = edit
  const [confirmTarget, setConfirmTarget] = useState(null);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery = `${u.name} ${u.username}`.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const handleSave = (form) => {
    if (modalUser?.id) {
      setUsers((list) => list.map((u) => (u.id === modalUser.id ? { ...u, ...form } : u)));
      showToast('User account updated (demo — not saved to a database yet).');
    } else {
      const id = `U${String(users.length + 1).padStart(3, '0')}`;
      setUsers((list) => [...list, { id, status: 'Active', ...form }]);
      showToast('User account created (demo — not saved to a database yet).');
    }
    setModalUser(null);
  };

  const toggleStatus = (user) => {
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u)));
    showToast(`${user.name} marked ${user.status === 'Active' ? 'Inactive' : 'Active'} (demo only).`);
    setConfirmTarget(null);
  };

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="All system accounts — Admin, Coach and Player — in one place (FR1 / FR17)"
        actions={<Button icon="person_add" onClick={() => setModalUser({})}>Add User</Button>}
      />

      <div className="table-toolbar">
        <div className="table-search">
          <Icon name="search" />
          <Input placeholder="Search by name or username…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="filter-row">
          {['All', 'Admin', 'Coach', 'Player'].map((r) => (
            <Button key={r} size="sm" variant={roleFilter === r ? 'primary' : 'secondary'} onClick={() => setRoleFilter(r)}>{r}</Button>
          ))}
        </div>
      </div>

      <DataTable
        rows={filtered}
        emptyTitle="No matching users"
        emptyHint="Try a different search term or role filter."
        columns={[
          { key: 'username', header: 'Username', render: (u) => <span className="mono">{u.username}</span> },
          { key: 'name', header: 'Name' },
          { key: 'role', header: 'Role', render: (u) => <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge> },
          { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
          {
            key: 'actions',
            header: '',
            render: (u) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => setModalUser(u)}>Edit</Button>
                <Button size="sm" variant={u.status === 'Active' ? 'danger' : 'secondary'} icon={u.status === 'Active' ? 'block' : 'check_circle'} onClick={() => setConfirmTarget(u)}>
                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ),
          },
        ]}
      />

      <UserFormModal open={!!modalUser} initial={modalUser} onClose={() => setModalUser(null)} onSave={handleSave} />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => toggleStatus(confirmTarget)}
        title={confirmTarget?.status === 'Active' ? 'Deactivate account?' : 'Activate account?'}
        message={confirmTarget && `${confirmTarget.name}'s account will be marked ${confirmTarget.status === 'Active' ? 'Inactive' : 'Active'}. This is demo-only in Phase 2 — no login is actually affected yet.`}
        confirmLabel={confirmTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        tone={confirmTarget?.status === 'Active' ? 'danger' : 'primary'}
      />
    </>
  );
}

function UserFormModal({ open, initial, onClose, onSave }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Player');

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setUsername(initial?.username || '');
      setRole(initial?.role || 'Player');
    }
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Edit User' : 'Add User'}
      subtitle={initial?.id ? undefined : 'Creating a Coach or Player account here will later create their linked profile record too.'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={() => onSave({ name, username, role })} disabled={!name || !username}>Save</Button>
      </>}
    >
      <div className="form-grid">
        <FormField label="Full Name" full><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nuwan Silva" /></FormField>
        <FormField label="Username"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. nuwan.s" /></FormField>
        <FormField label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Admin</option>
            <option>Coach</option>
            <option>Player</option>
          </Select>
        </FormField>
        <FormField label="Temporary Password" full hint="Password hashing + real credential issuing arrive with FastAPI (Phase 5).">
          <Input type="password" placeholder="Set during Phase 5" disabled />
        </FormField>
      </div>
    </Modal>
  );
}
