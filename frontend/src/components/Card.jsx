import { classNames } from '../utils/format.js';

export function Card({ kicker, title, subtitle, actions, children, className = '', style }) {
  return (
    <div className={classNames('card', className)} style={style}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {kicker && <div className="card-kicker">{kicker}</div>}
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div className="text-faint" style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone = 'primary' }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon" style={tone !== 'primary' ? toneStyle(tone) : undefined}>
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

function toneStyle(tone) {
  const map = {
    cyan: { background: 'rgba(var(--color-cyan-rgb),.14)', color: 'var(--color-cyan)' },
    amber: { background: 'rgba(var(--color-amber-rgb),.16)', color: 'var(--color-amber)' },
    error: { background: 'rgba(var(--color-error-rgb),.14)', color: 'var(--color-error)' },
  };
  return map[tone];
}
