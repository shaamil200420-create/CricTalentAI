import { classNames } from '../utils/format.js';

export function FormField({ label, hint, error, wide, full, children, htmlFor }) {
  return (
    <div className={classNames('field', wide && 'wide', full && 'full')}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function Input({ error, className = '', ...rest }) {
  return <input className={classNames('input', error && 'has-error', className)} {...rest} />;
}

export function Select({ error, className = '', children, ...rest }) {
  return (
    <select className={classNames('select', error && 'has-error', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ error, className = '', ...rest }) {
  return <textarea className={classNames('textarea', error && 'has-error', className)} {...rest} />;
}
