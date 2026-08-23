import { createContext, useContext, useEffect, useState } from 'react';

// Shared light/dark theme context used by every portal (Login, Admin, Coach,
// Player) so theme behaviour is implemented exactly once. Preference is
// remembered in localStorage; the OS preference is used when the visitor
// has never chosen explicitly (see styles/tokens.css's prefers-color-scheme
// block for that default).
const ThemeContext = createContext(null);
const STORAGE_KEY = 'crictalentai-theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  const resolved = theme || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const toggleTheme = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme: resolved, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
