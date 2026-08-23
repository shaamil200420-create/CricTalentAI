import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge, Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { FormField, Input, Select } from '../../components/FormField.jsx';
import { SCHEDULE_ITEMS as INITIAL_ITEMS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

const KIND_TONE = { Match: 'cyan', Training: 'primary' };

export default function ScheduleManagement() {
  const [items, setItems] = useState(INITIAL_ITEMS.map((i) => ({ status: 'Scheduled', ...i })));
  const [kindFilter, setKindFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({ kind: 'Training', title: '', date: '', time: '', venue: '' });

  const filtered = useMemo(
    () => items.filter((i) => kindFilter === 'All' || i.kind === kindFilter),
    [items, kindFilter],
  );

  const openAdd = () => { setEditing(null); setForm({ kind: 'Training', title: '', date: '', time: '', venue: '' }); setFormOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({ kind: i.kind, title: i.title, date: i.date, time: i.time, venue: i.venue }); setFormOpen(true); };

  const save = () => {
    if (editing) {
      setItems((list) => list.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
      showToast('Schedule item updated (demo only).');
    } else {
      setItems((list) => [...list, { id: `SC${String(list.length + 1).padStart(3, '0')}`, status: 'Scheduled', ...form }]);
      showToast('Schedule item created (demo only).');
    }
    setFormOpen(false);
  };

  const cancelItem = () => {
    setItems((list) => list.map((i) => (i.id === cancelTarget.id ? { ...i, status: 'Cancelled' } : i)));
    showToast(`${cancelTarget.title} marked Cancelled (demo only).`);
    setCancelTarget(null);
  };

  return (
    <>
      <PageHeader
        title="Schedule Management"
        subtitle="Create, edit and cancel Match and Training schedule entries (FR5)"
        actions={<Button icon="event" onClick={openAdd}>Add Schedule Item</Button>}
      />

      <div className="table-toolbar">
        <div className="filter-row">
          {['All', 'Match', 'Training'].map((k) => (
            <Button key={k} size="sm" variant={kindFilter === k ? 'primary' : 'secondary'} onClick={() => setKindFilter(k)}>{k}</Button>
          ))}
        </div>
      </div>

      <DataTable
        rows={filtered}
        emptyTitle="No schedule items"
        columns={[
          { key: 'kind', header: 'Type', render: (i) => <Badge tone={KIND_TONE[i.kind]}>{i.kind}</Badge> },
          { key: 'title', header: 'Title' },
          { key: 'date', header: 'Date', render: (i) => formatDate(i.date) },
          { key: 'time', header: 'Time', render: (i) => <span className="mono">{i.time}</span> },
          { key: 'venue', header: 'Venue' },
          { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
          {
            key: 'actions', header: '',
            render: (i) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary" icon="edit" disabled={i.status === 'Cancelled'} onClick={() => openEdit(i)}>Edit</Button>
                <Button size="sm" variant="danger" icon="event_busy" disabled={i.status === 'Cancelled'} onClick={() => setCancelTarget(i)}>Cancel</Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Schedule Item' : 'Add Schedule Item'}
        footer={<>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="primary" icon="save" onClick={save} disabled={!form.title || !form.date}>Save</Button>
        </>}
      >
        <div className="form-grid">
          <FormField label="Type">
            <Select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
              <option>Training</option>
              <option>Match</option>
            </Select>
          </FormField>
          <FormField label="Title" full><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={form.kind === 'Match' ? 'e.g. vs Metro Falcons' : 'e.g. Batting & Fielding Practice'} /></FormField>
          <FormField label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></FormField>
          <FormField label="Time"><Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></FormField>
          <FormField label="Venue" full><Input value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} /></FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelItem}
        title="Cancel schedule item?"
        message={cancelTarget && `${cancelTarget.title} on ${formatDate(cancelTarget.date)} will be marked Cancelled (demo only).`}
        tone="danger"
        confirmLabel="Cancel Item"
      />
    </>
  );
}
