import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { initials } from '../utils/format.js';

export default function Sidebar({ portalLabel, navGroups, identity, onLogout, open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label={`${portalLabel} navigation`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">CT</div>
          <div>
            <div className="sidebar-brand-text">CricTalentAI</div>
            <div className="sidebar-brand-sub">{portalLabel}</div>
          </div>
        </div>

        {navGroups.map((group) => (
          <div key={group.label || 'main'}>
            {group.label && <div className="sidebar-label">{group.label}</div>}
            <nav className="sidebar-nav">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        <div className="sidebar-footer">
          {identity && (
            <div className="identity-chip">
              <div className="identity-avatar">{initials(identity.name)}</div>
              <div>
                <div className="identity-name">{identity.name}</div>
                <div className="identity-role">{identity.title || identity.role}</div>
              </div>
            </div>
          )}
          <button className="nav-btn" onClick={onLogout} type="button">
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
