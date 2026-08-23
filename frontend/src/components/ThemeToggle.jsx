import { useTheme } from '../context/ThemeContext.jsx';
import Icon from './Icon.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle light/dark theme">
      <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={19} />
    </button>
  );
}
