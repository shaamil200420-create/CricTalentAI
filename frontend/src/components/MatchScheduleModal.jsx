import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { FormField, Input, Select } from './FormField.jsx';
import { StatusBadge } from './Badge.jsx';
import { formatDate } from '../utils/format.js';

/*
 * THE single Match Schedule form — used identically by:
 *   Admin -> Schedule Management -> Create Schedule -> Match
 *   Coach -> Matches -> Add Match Schedule
 * Same fields, same design, same data model (backed by GET/POST/PUT
 * /api/matches — see services calls in each page). Never duplicate this
 * component per role; both pages import this same file.
 */
const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled'];

export function MatchScheduleFormModal({ open, initial, tournaments, onClose, onSave }) {
  const [opponent, setOpponent] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState('Scheduled');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setOpponent(initial?.opponent || '');
      setTournamentId(initial?.tournamentId || '');
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
    if (!opponent.trim()) errs.opponent = 'Opponent is required.';
    if (!date) errs.date = 'Match date is required.';
    if (!time) errs.time = 'Start time is required.';
    if (!venue.trim()) errs.venue = 'Venue is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({ opponent, tournamentId, date, time, venue, status });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Match Schedule' : 'Add Match Schedule'}
      subtitle="T20 format only"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="save" onClick={submit}>{isEdit ? 'Save Changes' : 'Save Match Schedule'}</Button>
      </>}
    >
      <div className="form-grid">
        <FormField label="Match ID"><Input value={isEdit ? initial.id : 'Auto-generated'} disabled readOnly /></FormField>
        <FormField label="Format"><Input value="T20" disabled readOnly /></FormField>
        <FormField label="Opponent" full error={errors.opponent}>
          <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Metro Falcons CC" />
        </FormField>
        <FormField label="Tournament" full hint="Optional — leave as Friendly / None for a practice match.">
          <Select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
            <option value="">Friendly / None</option>
            {(tournaments || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Match Date" error={errors.date}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Start Time" error={errors.time}><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></FormField>
        <FormField label="Venue" full error={errors.venue}><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Central Academy Oval" /></FormField>
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}

export function MatchScheduleViewModal({ match, onClose, onEdit, onCancel }) {
  return (
    <Modal
      open={!!match}
      onClose={onClose}
      title={match ? `${match.opponent} — ${formatDate(match.date)}` : ''}
      subtitle="Match Schedule · read-only"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button variant="secondary" icon="edit" onClick={() => onEdit(match)}>Edit</Button>
        {match?.status === 'Scheduled' && (
          <Button variant="danger" icon="event_busy" onClick={() => onCancel(match)}>Cancel</Button>
        )}
      </>}
    >
      {match && (
        <div className="form-grid">
          <FormField label="Match ID"><Input value={match.id} disabled readOnly /></FormField>
          <FormField label="Format"><Input value={match.format} disabled readOnly /></FormField>
          <FormField label="Opponent" full><Input value={match.opponent} disabled readOnly /></FormField>
          <FormField label="Tournament" full><Input value={match.tournament || 'Friendly / None'} disabled readOnly /></FormField>
          <FormField label="Match Date"><Input value={formatDate(match.date)} disabled readOnly /></FormField>
          <FormField label="Start Time"><Input value={match.time || '—'} disabled readOnly /></FormField>
          <FormField label="Venue" full><Input value={match.venue} disabled readOnly /></FormField>
          <FormField label="Status"><div style={{ paddingTop: 6 }}><StatusBadge status={match.status} /></div></FormField>
        </div>
      )}
    </Modal>
  );
}
