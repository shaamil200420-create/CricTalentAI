import { useState } from 'react';
import { Input } from './FormField.jsx';
import Icon from './Icon.jsx';

// Preserves the Login prototype's show/hide password affordance.
export default function PasswordInput({ ...rest }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-affix-wrap">
      <Input type={visible ? 'text' : 'password'} {...rest} />
      <button
        type="button"
        className="input-affix-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <Icon name={visible ? 'visibility_off' : 'visibility'} size={18} />
      </button>
    </div>
  );
}
