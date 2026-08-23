import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import { FormField, Input } from '../../components/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const INITIAL_ADMINS = [
  { id: 'A001', name: 'Admin User', username: 'admin', email: 'admin@crictalentai.local', status: 'Active' },
];

export default function AdminManagement() {
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const addAdmin = () => {
    setAdmins((list) => [...list, { id: `A${String(list.length + 1).padStart(3, '0')}`, name, username, email, status: 'Active' }]);
    showToast('Administrator account created (demo only).');
    setOpen(false);
    setName(''); setUsername(''); setEmail('');
  };

  return (
    <>
      <PageHeader
        title="Admin Management"
        subtitle="View and manage administrator accounts"
        actions={<Button icon="person_add" onClick={() => setOpen(true)}>Add Admin</Button>}
      />

      <DataTable
        rows={admins}
        emptyTitle="No administrator accounts yet"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'username', header: 'Username', render: (a) => <span className="mono">{a.username}</span> },
          { key: 'email', header: 'Email' },
          { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Admin"
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" icon="save" onClick={addAdmin} disabled={!name || !username}>Save</Button>
        </>}
      >
        <div className="form-grid">
          <FormField label="Full Name" full><Input value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Username"><Input value={username} onChange={(e) => setUsername(e.target.value)} /></FormField>
          <FormField label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
        </div>
      </Modal>
    </>
  );
}
