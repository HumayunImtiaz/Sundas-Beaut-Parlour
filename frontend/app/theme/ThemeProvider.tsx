'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '../providers/ToastProvider';

type Theme = 'dark' | 'light';
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { showToast } = useToast();
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    let nextTheme: Theme = 'dark';
    try {
      nextTheme = window.localStorage.getItem('sundas-theme') === 'light' ? 'light' : 'dark';
    } catch {
      showToast('Your theme preference could not be loaded from this browser.', 'warning');
    }
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, [showToast]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem('sundas-theme', nextTheme);
    } catch {
      showToast('Theme changed, but this browser could not save your preference.', 'warning');
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}