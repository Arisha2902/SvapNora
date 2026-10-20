import { createContext, useContext, useMemo } from 'react';

import { useTheme } from '../hooks/useTheme.js';

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, toggle] = useTheme();

  const value = useMemo(() => ({ theme, toggle, isDark: theme === 'dark' }), [theme, toggle]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeContext must be used inside ThemeProvider');
  return ctx;
}
