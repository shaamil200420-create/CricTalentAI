import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { FormField, Input, Select } from './FormField.jsx';
import { StatusBadge } from './Badge.jsx';
import { formatDate } from '../utils/format.js';

/*
 * THE single Training Schedule form — used identically by:
 *   Admin -> Schedule Management -> Create Schedule -> Training
 *   Coach -> Training -> Add Training Schedule
 * Same fields, same design, same data model (backed by GET/POST/PUT
 * /api/schedules). Never duplicate this component per role; both pages
 * import this same file.
 */
const TRAINING_TYPES = ['Batting', 'Bowling', 'Fielding', 'Fitness', 'General'];
const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled'];

export function TrainingScheduleFormModal({ open, initial, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [trainingType, setTrainingType] = useState('Batting');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState('Scheduled');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || '');
      setTrainingType(initial?.trainingType || 'Batting');
      setDate(initial?.date || '');
      setTime(initial?.time || '');
      setVenue(initial?.venue || '');
      setStatus(initial?.status || 'Scheduled');
      setErrors({});
    }
  }, [open, initial]);

  const isEdit = !!initial?.id;

  const submit = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Session name is required.';
    if (!date) errs.date = 'Date is required.';
    if (!time) errs.time = 'Start time is required.';
    if (!venue.trim()) errs.venue = 'Venue is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({ title, trainingType, date, time, venue, status });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Training Schedule' : 'Add Training Schedule'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={submit}>{isEdit ? 'Save Changes' : 'Save Training Schedule'}</Button>
      </>}
    >
      <div className="form-grid">
        <FormField label="Session ID"><Input value={isEdit ? initial.id : 'Auto-generated'} disabled readOnly /></FormField>
        <FormField label="Training Type">
          <Select value={trainingType} onChange={(e) => setTrainingType(e.target.value)}>
            {TRAINING_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </FormField>
        <FormField label="Session Name" full error={errors.title}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Batting Practice" />
        </FormField>
        <FormField label="Date" error={errors.date}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Start Time" error={errors.time}><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></FormField>
        <FormField label="Venue" full error={errors.venue}><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Indoor Nets" /></FormField>
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}

export function TrainingScheduleViewModal({ session, onClose, onEdit, onCancel }) {
  return (
    <Modal
      open={!!session}
      onClose={onClose}
      title={session?.title}
      subtitle="Training Schedule · read-only"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button variant="secondary" icon="edit" onClick={() => onEdit(session)}>Edit</Button>
        {session?.status === 'Scheduled' && (
          <Button variant="danger" icon="event_busy" onClick={() => onCancel(session)}>Cancel</Button>
        )}
      </>}
    >
      {session && (
        <div className="form-grid">
          <FormField label="Session ID"><Input value={session.id} disabled readOnly /></FormField>
          <FormField label="Training Type"><Input value={session.trainingType || '—'} disabled readOnly /></FormField>
          <FormField label="Session Name" full><Input value={session.title} disabled readOnly /></FormField>
          <FormField label="Date"><Input value={formatDate(session.date)} disabled readOnly /></FormField>
          <FormField label="Start Time"><Input value={session.time || '—'} disabled readOnly /></FormField>
          <FormField label="Venue" full><Input value={session.venue} disabled readOnly /></FormField>
          <FormField label="Status"><div style={{ paddingTop: 6 }}><StatusBadge status={session.status} /></div></FormField>
        </div>
      )}
    </Modal>
  );
}
