import { useEffect } from 'react';
import { getStoredColorTheme, applyColorTheme } from '@/lib/colorThemes';

/**
 * Applies stored theme (light/dark) and color on app load so login and all pages use them.
 */
export function ThemeInitializer() {
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const theme =
      stored === 'dark' || stored === 'light'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    const color = getStoredColorTheme();
    applyColorTheme(color, theme === 'dark');
  }, []);
  return null;
}
