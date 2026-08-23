import Icon from './Icon.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function TopHeader({ title, subtitle, onMenuClick }) {
  return (
    <header className="top-header">
      <div className="top-header-left">
        <button className="icon-btn menu-toggle" onClick={onMenuClick} aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
        <div>
          <div className="top-header-title">{title}</div>
          {subtitle && <div className="top-header-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="top-header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
