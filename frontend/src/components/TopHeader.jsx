import Icon from './Icon.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { initials } from '../utils/format.js';

export default function TopHeader({ title, subtitle, onMenuClick, statusPill, right, variant, identity }) {
  return (
    <header className={`top-header${variant ? ` top-header--${variant}` : ''}`}>
      <div className="top-header-left">
        <button className="icon-btn menu-toggle" onClick={onMenuClick} aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
        <div>
          <div className="top-header-title">{title}</div>
          {(subtitle || statusPill) && (
            <div className="top-header-sub-row">
              {statusPill && (
                <span className="top-header-pill">
                  <span className="top-header-pill-dot" />
                  {statusPill}
                </span>
              )}
              {subtitle && <div className="top-header-sub">{subtitle}</div>}
            </div>
          )}
        </div>
      </div>
      <div className="top-header-actions">
        {right}
        <ThemeToggle />
        {identity && (
          <div className="top-header-identity">
            <div>
              <div className="top-header-identity-name">{identity.name}</div>
              <div className="top-header-identity-role">{identity.title || identity.role}</div>
            </div>
            <div className="top-header-identity-avatar">{initials(identity.name)}</div>
          </div>
        )}
      </div>
    </header>
  );
}
