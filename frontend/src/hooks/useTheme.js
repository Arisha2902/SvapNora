import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'SvapNora-theme';

/**
 * Light/dark theme state. Dark is the default. Persisted to localStorage.
 * Drives the `data-theme` attribute on <html>, which switches CSS variables.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — theme still applies for the session */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggle];
}
