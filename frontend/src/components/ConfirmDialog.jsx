import Modal from './Modal.jsx';
import Button from './Button.jsx';
import Icon from './Icon.jsx';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  tone = 'danger', // danger | primary
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div
        className="confirm-icon"
        style={{
          background: tone === 'danger' ? 'rgba(var(--color-error-rgb),.14)' : 'rgba(var(--color-primary-rgb),.14)',
          color: tone === 'danger' ? 'var(--color-error)' : 'var(--color-primary)',
        }}
      >
        <Icon name={tone === 'danger' ? 'warning' : 'help'} />
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm?.(); onClose?.(); }}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
