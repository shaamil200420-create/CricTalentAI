import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { Card } from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import DataTable from '../../components/DataTable.jsx';
import { StatusBadge, Badge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { MatchScheduleFormModal, MatchScheduleViewModal } from '../../components/MatchScheduleModal.jsx';
import { TrainingScheduleFormModal, TrainingScheduleViewModal } from '../../components/TrainingScheduleModal.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

const KIND_TONE = { Match: 'cyan', Training: 'primary' };

// Schedule Management — the ONE shared scheduling page, used identically by
// BOTH Admin (pages/admin/ScheduleManagement.jsx) and Coach
// (pages/coach/ScheduleManagement.jsx), which are both thin re-exports of
// this exact file. Same header, same Create Schedule button, same
// All/Match/Training filters, same combined table, same modals, same
// actions — Admin and Coach get pixel-identical pages by construction, not
// by convention. It reads the SAME two shared sources everyone else reads —
// GET /matches and GET /schedules — and merges them into one table.
// Creating/editing here updates those exact same records Player My
// Schedule also reads: never a separate "admin copy" or "coach copy".
// The only difference between the two roles is enforced server-side
// (require_staff on the backend routes) — not in this component.
export default function ScheduleManagement() {
  const [matches, setMatches] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [kindFilter, setKindFilter] = useState('All');
  const { showToast } = useToast();

  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [matchFormOpen, setMatchFormOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [trainingFormOpen, setTrainingFormOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [viewMatch, setViewMatch] = useState(null);
  const [viewTraining, setViewTraining] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null); // { type, item }
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }

  const load = () => {
    apiRequest('/matches').then(setMatches).catch((err) => showToast(err.message, 'error'));
    apiRequest('/schedules').then(setTrainings).catch((err) => showToast(err.message, 'error'));
    apiRequest('/admin/tournaments').then(setTournaments).catch((err) => showToast(err.message, 'error'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const matchRows = matches.map((m) => ({ recordType: 'Match', key: `M-${m.id}`, title: `vs ${m.opponent}`, ...m }));
    const trainingRows = trainings.map((s) => ({ recordType: 'Training', key: `T-${s.id}`, ...s }));
    const all = [...matchRows, ...trainingRows];
    all.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    return kindFilter === 'All' ? all : all.filter((r) => r.recordType === kindFilter);
  }, [matches, trainings, kindFilter]);

  const openAddMatch = () => { setEditingMatch(null); setTypePickerOpen(false); setMatchFormOpen(true); };
  const openAddTraining = () => { setEditingTraining(null); setTypePickerOpen(false); setTrainingFormOpen(true); };

  const openEdit = (row) => {
    if (row.recordType === 'Match') { setEditingMatch(row); setMatchFormOpen(true); }
    else { setEditingTraining(row); setTrainingFormOpen(true); }
  };

  const openView = (row) => {
    if (row.recordType === 'Match') setViewMatch(row);
    else setViewTraining(row);
  };

  const saveMatch = async (form) => {
    try {
      if (editingMatch) {
        const updated = await apiRequest(`/matches/${editingMatch.id}`, { method: 'PUT', body: form });
        setMatches((list) => list.map((m) => (m.id === editingMatch.id ? updated : m)));
        showToast('Match schedule updated.');
      } else {
        const created = await apiRequest('/matches', { method: 'POST', body: form });
        setMatches((list) => [...list, created]);
        showToast('Match schedule created.');
      }
      setMatchFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const saveTraining = async (form) => {
    try {
      if (editingTraining) {
        const updated = await apiRequest(`/schedules/${editingTraining.id}`, { method: 'PUT', body: form });
        setTrainings((list) => list.map((s) => (s.id === editingTraining.id ? updated : s)));
        showToast('Training schedule updated.');
      } else {
        const created = await apiRequest('/schedules', { method: 'POST', body: form });
        setTrainings((list) => [...list, created]);
        showToast('Training schedule created.');
      }
      setTrainingFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmCancel = async () => {
    const { type, item } = cancelTarget;
    try {
      if (type === 'Match') {
        const updated = await apiRequest(`/matches/${item.id}/cancel`, { method: 'PATCH' });
        setMatches((list) => list.map((m) => (m.id === item.id ? updated : m)));
      } else {
        const updated = await apiRequest(`/schedules/${item.id}/cancel`, { method: 'PATCH' });
        setTrainings((list) => list.map((s) => (s.id === item.id ? updated : s)));
      }
      showToast(`${type} schedule marked Cancelled.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  const confirmDelete = async () => {
    const { type, item } = deleteTarget;
    try {
      if (type === 'Match') {
        await apiRequest(`/matches/${item.id}`, { method: 'DELETE' });
        setMatches((list) => list.filter((m) => m.id !== item.id));
      } else {
        await apiRequest(`/schedules/${item.id}`, { method: 'DELETE' });
        setTrainings((list) => list.filter((s) => s.id !== item.id));
      }
      showToast(`${type} schedule deleted.`);
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
          title="Schedule Management"
          subtitle="Create, edit and cancel Match and Training schedules (FR5)"
          actions={<Button icon="event" onClick={() => setTypePickerOpen(true)}>Create Schedule</Button>}
        />

        <div className="table-toolbar">
          <div className="filter-row">
            {['All', 'Match', 'Training'].map((k) => (
              <Button key={k} size="sm" variant={kindFilter === k ? 'primary' : 'secondary'} onClick={() => setKindFilter(k)}>{k}</Button>
            ))}
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey="key"
          emptyTitle="No schedule items"
          columns={[
            { key: 'recordType', header: 'Type', render: (r) => <Badge tone={KIND_TONE[r.recordType]}>{r.recordType}</Badge> },
            { key: 'title', header: 'Title' },
            { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
            { key: 'time', header: 'Time', render: (r) => r.time ? <span className="mono">{r.time}</span> : <span className="text-faint">—</span> },
            { key: 'venue', header: 'Venue' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions', header: '',
              render: (r) => (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button type="button" className="icon-btn" title={`View ${r.recordType} Schedule`} onClick={() => openView(r)}><Icon name="visibility" size={18} /></button>
                  <button type="button" className="icon-btn" title={`Edit ${r.recordType} Schedule`} onClick={() => openEdit(r)}><Icon name="edit" size={18} /></button>
                  <button type="button" className="icon-btn" title={`Cancel ${r.recordType} Schedule`} disabled={r.status !== 'Scheduled'} onClick={() => setCancelTarget({ type: r.recordType, item: r })}><Icon name="event_busy" size={18} /></button>
                  <button type="button" className="icon-btn" title={`Delete ${r.recordType} Schedule`} onClick={() => setDeleteTarget({ type: r.recordType, item: r })}><Icon name="delete" size={18} /></button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title="Create Schedule"
        subtitle="Schedule Type"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="secondary" icon="sports_cricket" block onClick={openAddMatch}>Match</Button>
          <Button variant="secondary" icon="fitness_center" block onClick={openAddTraining}>Training</Button>
        </div>
      </Modal>

      <MatchScheduleFormModal
        open={matchFormOpen}
        initial={editingMatch}
        tournaments={tournaments}
        onClose={() => setMatchFormOpen(false)}
        onSave={saveMatch}
      />
      <TrainingScheduleFormModal
        open={trainingFormOpen}
        initial={editingTraining}
        onClose={() => setTrainingFormOpen(false)}
        onSave={saveTraining}
      />

      <MatchScheduleViewModal
        match={viewMatch}
        onClose={() => setViewMatch(null)}
        onEdit={(m) => { setViewMatch(null); openEdit({ ...m, recordType: 'Match' }); }}
        onCancel={(m) => { setViewMatch(null); setCancelTarget({ type: 'Match', item: m }); }}
      />
      <TrainingScheduleViewModal
        session={viewTraining}
        onClose={() => setViewTraining(null)}
        onEdit={(s) => { setViewTraining(null); openEdit({ ...s, recordType: 'Training' }); }}
        onCancel={(s) => { setViewTraining(null); setCancelTarget({ type: 'Training', item: s }); }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title={cancelTarget && `Cancel ${cancelTarget.type} Schedule?`}
        message={
          cancelTarget?.type === 'Match'
            ? 'This match will be marked as Cancelled. The schedule record will remain available for history.'
            : 'This training session will be marked as Cancelled. The record will remain available for history.'
        }
        tone="danger"
        confirmLabel="Confirm Cancellation"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget && `Delete ${deleteTarget.type} Schedule?`}
        message={
          deleteTarget?.type === 'Match'
            ? 'This will permanently remove this schedule because it was created by mistake. This action cannot be undone.'
            : 'This will permanently remove this training schedule. This action cannot be undone.'
        }
        tone="danger"
        confirmLabel="Delete Schedule"
      />
    </div>
  );
}
