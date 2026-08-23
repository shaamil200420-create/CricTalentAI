import { classNames } from '../utils/format.js';
import Icon from './Icon.jsx';

export default function Button({
  children,
  variant = 'primary', // primary | secondary | ghost | danger
  size = 'md', // md | sm
  icon,
  block = false,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={classNames('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block', className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  );
}
