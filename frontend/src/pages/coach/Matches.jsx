import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { MatchScheduleFormModal, MatchScheduleViewModal } from '../../components/MatchScheduleModal.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiRequest } from '../../services/api.js';

// Coach -> Matches is specifically for Match schedules — the SAME shared
// records Admin -> Schedule Management and Player -> My Schedule read
// (GET/POST/PUT /api/matches). Uses the exact same MatchScheduleFormModal/
// MatchScheduleViewModal as Admin — no separate Coach-only match form.
// Player performance figures (runs, wickets, etc.) are recorded elsewhere
// (Coach -> Match Entry / Match Records) — never inside this schedule.
export default function CoachMatches() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest('/matches').then(setMatches).catch((err) => showToast(err.message, 'error'));
    apiRequest('/admin/tournaments').then(setTournaments).catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (m) => { setEditing(m); setFormOpen(true); };

  const save = async (form) => {
    try {
      if (editing) {
        const updated = await apiRequest(`/matches/${editing.id}`, { method: 'PUT', body: form });
        setMatches((list) => list.map((m) => (m.id === editing.id ? updated : m)));
        showToast('Match schedule updated.');
      } else {
        const created = await apiRequest('/matches', { method: 'POST', body: form });
        setMatches((list) => [...list, created]);
        showToast('Match schedule created.');
      }
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmCancel = async () => {
    try {
      const updated = await apiRequest(`/matches/${cancelTarget.id}/cancel`, { method: 'PATCH' });
      setMatches((list) => list.map((m) => (m.id === cancelTarget.id ? updated : m)));
      showToast('Match schedule marked Cancelled.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await apiRequest(`/matches/${deleteTarget.id}`, { method: 'DELETE' });
      setMatches((list) => list.filter((m) => m.id !== deleteTarget.id));
      showToast('Match schedule deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Matches"
        subtitle="Match schedules for the current season"
        actions={<Button icon="event" onClick={openAdd}>Add Match Schedule</Button>}
      />

      <DataTable
        rows={matches}
        emptyTitle="No matches scheduled yet"
        columns={[
          { key: 'date', header: 'Date', render: (m) => formatDate(m.date) },
          { key: 'time', header: 'Time', render: (m) => m.time ? <span className="mono">{m.time}</span> : <span className="text-faint">—</span> },
          { key: 'opponent', header: 'Opponent' },
          { key: 'venue', header: 'Venue' },
          { key: 'tournament', header: 'Tournament', render: (m) => m.tournament || <span className="text-faint">Friendly / None</span> },
          { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
          { key: 'result', header: 'Result', render: (m) => m.status === 'Completed' && m.result ? <StatusBadge status={m.result} /> : <span className="text-faint">—</span> },
          {
            key: 'actions', header: '',
            render: (m) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button type="button" className="icon-btn" title="View Match Schedule" onClick={() => setViewTarget(m)}><Icon name="visibility" size={18} /></button>
                <button type="button" className="icon-btn" title="Edit Match Schedule" onClick={() => openEdit(m)}><Icon name="edit" size={18} /></button>
                <button type="button" className="icon-btn" title="Cancel Match Schedule" disabled={m.status !== 'Scheduled'} onClick={() => setCancelTarget(m)}><Icon name="event_busy" size={18} /></button>
                <button type="button" className="icon-btn" title="Delete Match Schedule" onClick={() => setDeleteTarget(m)}><Icon name="delete" size={18} /></button>
              </div>
            ),
          },
        ]}
      />

      <MatchScheduleFormModal
        open={formOpen}
        initial={editing}
        tournaments={tournaments}
        onClose={() => setFormOpen(false)}
        onSave={save}
      />

      <MatchScheduleViewModal
        match={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(m) => { setViewTarget(null); openEdit(m); }}
        onCancel={(m) => { setViewTarget(null); setCancelTarget(m); }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel Match Schedule?"
        message="This match will be marked as Cancelled. The schedule record will remain available for history."
        tone="danger"
        confirmLabel="Confirm Cancellation"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Match Schedule?"
        message="This will permanently remove this schedule because it was created by mistake. This action cannot be undone."
        tone="danger"
        confirmLabel="Delete Schedule"
      />
    </>
  );
}
