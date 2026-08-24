import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Input } from '../../components/FormField.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PLAYERS } from '../../data/mockData.js';
import { login } from '../../services/auth.js';

const DEMO_PORTALS = [
  { role: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
  { role: 'coach', label: 'Coach', icon: 'sports_cricket' },
  { role: 'player', label: 'Player', icon: 'groups' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loginAsDemo, loginWithToken } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Enter your username and password.', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(username, password);
      loginWithToken(user);
      showToast(`Welcome back, ${user.name}.`, 'success');
      navigate(`/${user.role.toLowerCase()}`);
    } catch (err) {
      showToast(err.message || 'Sign in failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = (role) => {
    loginAsDemo(role);
    navigate(`/${role}`);
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-top">
          <div className="login-brand">
            <div className="sidebar-brand-mark">
              <Icon name="sports_cricket" size={20} filled style={{ color: 'var(--text-on-primary)' }} />
            </div>
            <span>CricTalentAI</span>
          </div>
          <ThemeToggle />
        </div>

        <span className="login-eyebrow">U19 T20 Academy Intelligence Network</span>
        <h1 className="login-headline">Spot the next<br /><em>great innings.</em></h1>
        <p className="login-copy">
          The scouting and performance-intelligence platform for a U19 cricket academy —
          track form, understand potential, and support the coach's decisions with data.
        </p>

        <div className="login-stats">
          <div>
            <div className="login-stat-num">{PLAYERS.length}</div>
            <div className="login-stat-label">Players in this demo</div>
          </div>
          <div>
            <div className="login-stat-num">3</div>
            <div className="login-stat-label">Portals: Admin / Coach / Player</div>
          </div>
          <div>
            <div className="login-stat-num">T20</div>
            <div className="login-stat-label">Format focus</div>
          </div>
        </div>
        <p className="login-stats-note">
          Illustrative figures for this UI preview — not live system statistics. Real AI/ML
          evaluation results (MAE / RMSE / R²) are reported once the model exists (Phase 12).
        </p>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <div className="login-card-head">
            <h2>Sign in to your command centre.</h2>
            <p className="text-muted" style={{ fontSize: 13 }}>Admin, Coach and Player all sign in here — your role is determined automatically.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <FormField label="Username" htmlFor="username">
              <Input id="username" placeholder="e.g. ravi.j" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </FormField>
            <FormField label="Password" htmlFor="password">
              <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </FormField>
            <Button type="submit" variant="primary" block icon="login" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</Button>
          </form>

          <div className="login-divider"><span>Preview a portal (demo, Phase 2 only)</span></div>

          <div className="login-demo-grid">
            {DEMO_PORTALS.map((p) => (
              <button key={p.role} type="button" className="login-demo-btn" onClick={() => handleDemo(p.role)}>
                <Icon name={p.icon} size={20} />
                {p.label}
              </button>
            ))}
          </div>

          <p className="login-footnote">
            Accounts are created by an Admin — there is no public sign-up. Real authentication
            (hashed passwords + JWT + role checks) arrives in Phase 5.
          </p>
        </div>
      </div>
    </div>
  );
}
