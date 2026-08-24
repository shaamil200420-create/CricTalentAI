import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { Badge, StatusBadge } from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { TrainingScheduleFormModal, TrainingScheduleViewModal } from '../../components/TrainingScheduleModal.jsx';
import { TRAINING_RECORDS_P001, PLAYERS } from '../../data/mockData.js';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

const TYPE_TONE = { Batting: 'primary', Bowling: 'cyan', Fielding: 'info', Fitness: 'amber', General: 'neutral' };

// Coach -> Training is specifically for Training schedules — the SAME
// shared records Admin -> Schedule Management and Player -> My Schedule
// read (GET/POST/PUT /api/schedules). Uses the exact same
// TrainingScheduleFormModal/TrainingScheduleViewModal as Admin.
//
// "View Attendance" below is a separate, existing affordance (Phase 2
// mock — the real Training Entry/attendance backend is out of scope for
// this task) and stays untouched; it is NOT the same as "View" (the
// read-only schedule view), which only shows schedule fields per spec.
export default function CoachTraining() {
  const [sessions, setSessions] = useState([]);
  const [attendanceTarget, setAttendanceTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  const p001 = PLAYERS.find((p) => p.id === 'P001');
  const record = attendanceTarget ? TRAINING_RECORDS_P001.find((r) => r.sessionId === attendanceTarget.id) : null;

  useEffect(() => {
    apiRequest('/schedules').then(setSessions).catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s) => { setEditing(s); setFormOpen(true); };

  const save = async (form) => {
    try {
      if (editing) {
        const updated = await apiRequest(`/schedules/${editing.id}`, { method: 'PUT', body: form });
        setSessions((list) => list.map((s) => (s.id === editing.id ? updated : s)));
        showToast('Training schedule updated.');
      } else {
        const created = await apiRequest('/schedules', { method: 'POST', body: form });
        setSessions((list) => [...list, created]);
        showToast('Training schedule created.');
      }
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmCancel = async () => {
    try {
      const updated = await apiRequest(`/schedules/${cancelTarget.id}/cancel`, { method: 'PATCH' });
      setSessions((list) => list.map((s) => (s.id === cancelTarget.id ? updated : s)));
      showToast('Training schedule marked Cancelled.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await apiRequest(`/schedules/${deleteTarget.id}`, { method: 'DELETE' });
      setSessions((list) => list.filter((s) => s.id !== deleteTarget.id));
      showToast('Training schedule deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Training"
        subtitle="Scheduled training sessions and recorded attendance"
        actions={<Button icon="event" onClick={openAdd}>Add Training Schedule</Button>}
      />

      <DataTable
        rows={sessions}
        emptyTitle="No training sessions scheduled"
        columns={[
          { key: 'title', header: 'Session' },
          { key: 'trainingType', header: 'Type', render: (s) => s.trainingType ? <Badge tone={TYPE_TONE[s.trainingType]}>{s.trainingType}</Badge> : <span className="text-faint">—</span> },
          { key: 'date', header: 'Date', render: (s) => formatDate(s.date) },
          { key: 'time', header: 'Time', render: (s) => s.time ? <span className="mono">{s.time}</span> : <span className="text-faint">—</span> },
          { key: 'venue', header: 'Venue' },
          { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
          {
            key: 'actions', header: '',
            render: (s) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary" icon="fact_check" onClick={() => setAttendanceTarget(s)}>View Attendance</Button>
                <button type="button" className="icon-btn" title="View Training Schedule" onClick={() => setViewTarget(s)}><Icon name="visibility" size={18} /></button>
                <button type="button" className="icon-btn" title="Edit Training Schedule" onClick={() => openEdit(s)}><Icon name="edit" size={18} /></button>
                <button type="button" className="icon-btn" title="Cancel Training Schedule" disabled={s.status !== 'Scheduled'} onClick={() => setCancelTarget(s)}><Icon name="event_busy" size={18} /></button>
                <button type="button" className="icon-btn" title="Delete Training Schedule" onClick={() => setDeleteTarget(s)}><Icon name="delete" size={18} /></button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!attendanceTarget}
        onClose={() => setAttendanceTarget(null)}
        title={attendanceTarget?.title}
        subtitle={attendanceTarget && `${formatDate(attendanceTarget.date)} · ${attendanceTarget.time || '—'} · ${attendanceTarget.venue}`}
        footer={<Button variant="primary" onClick={() => setAttendanceTarget(null)}>Close</Button>}
      >
        {record ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Attendance</th><th>Fitness</th><th>Coach Rating</th></tr></thead>
              <tbody>
                <tr>
                  <td>{p001?.name}</td>
                  <td>{record.attendance}</td>
                  <td>{record.fitnessScore ?? '—'}</td>
                  <td>{record.coachRating ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-faint" style={{ fontSize: 12.5 }}>No demo attendance record for this session yet.</p>
        )}
      </Modal>

      <TrainingScheduleFormModal open={formOpen} initial={editing} onClose={() => setFormOpen(false)} onSave={save} />

      <TrainingScheduleViewModal
        session={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(s) => { setViewTarget(null); openEdit(s); }}
        onCancel={(s) => { setViewTarget(null); setCancelTarget(s); }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel Training Schedule?"
        message="This training session will be marked as Cancelled. The record will remain available for history."
        tone="danger"
        confirmLabel="Confirm Cancellation"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Training Schedule?"
        message="This will permanently remove this training schedule. This action cannot be undone."
        tone="danger"
        confirmLabel="Delete Schedule"
      />
    </>
  );
}
