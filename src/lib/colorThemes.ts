/**
 * Color theme presets. HSL values (no "hsl()" wrapper).
 * Applied as CSS variables: --primary, --accent, --ring, sidebar-*.
 */
export type ColorThemeId = 'teal' | 'blue' | 'pink' | 'purple' | 'orange' | 'green';

interface ThemeVars {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarRing: string;
}

export interface ColorThemePreset {
  light: ThemeVars;
  dark: ThemeVars;
  swatch: string;
  label: string;
}

function vars(
  primary: string,
  primaryFg: string,
  accent: string,
  accentFg: string,
  ring: string,
  sidePrimary: string,
  sidePrimaryFg: string,
  sideAccent: string,
  sideAccentFg: string,
  sideRing: string
): ThemeVars {
  return {
    primary,
    primaryForeground: primaryFg,
    accent,
    accentForeground: accentFg,
    ring,
    sidebarPrimary: sidePrimary,
    sidebarPrimaryForeground: sidePrimaryFg,
    sidebarAccent: sideAccent,
    sidebarAccentForeground: sideAccentFg,
    sidebarRing: sideRing,
  };
}

export const COLOR_THEMES: Record<ColorThemeId, ColorThemePreset> = {
  teal: {
    light: vars('174 58% 40%', '0 0% 100%', '174 45% 92%', '174 58% 30%', '174 58% 40%', '174 58% 40%', '0 0% 98%', '174 45% 95%', '174 58% 30%', '174 58% 40%'),
    dark: vars('174 55% 50%', '220 25% 8%', '174 40% 20%', '174 55% 70%', '174 55% 50%', '174 55% 50%', '220 25% 8%', '174 40% 18%', '174 55% 70%', '174 55% 50%'),
    swatch: '#0d9488',
    label: 'Teal',
  },
  blue: {
    light: vars('217 91% 60%', '0 0% 100%', '217 70% 92%', '217 91% 35%', '217 91% 60%', '217 91% 60%', '0 0% 98%', '217 70% 95%', '217 91% 35%', '217 91% 60%'),
    dark: vars('217 91% 65%', '220 25% 8%', '217 50% 22%', '217 80% 75%', '217 91% 65%', '217 91% 65%', '220 25% 8%', '217 50% 18%', '217 80% 75%', '217 91% 65%'),
    swatch: '#2563eb',
    label: 'Blue',
  },
  pink: {
    light: vars('330 81% 60%', '0 0% 100%', '330 70% 92%', '330 81% 35%', '330 81% 60%', '330 81% 60%', '0 0% 98%', '330 70% 95%', '330 81% 35%', '330 81% 60%'),
    dark: vars('330 81% 65%', '220 25% 8%', '330 50% 22%', '330 75% 75%', '330 81% 65%', '330 81% 65%', '220 25% 8%', '330 50% 18%', '330 75% 75%', '330 81% 65%'),
    swatch: '#db2777',
    label: 'Pink',
  },
  purple: {
    light: vars('262 83% 58%', '0 0% 100%', '262 70% 92%', '262 83% 35%', '262 83% 58%', '262 83% 58%', '0 0% 98%', '262 70% 95%', '262 83% 35%', '262 83% 58%'),
    dark: vars('262 83% 63%', '220 25% 8%', '262 50% 22%', '262 75% 75%', '262 83% 63%', '262 83% 63%', '220 25% 8%', '262 50% 18%', '262 75% 75%', '262 83% 63%'),
    swatch: '#7c3aed',
    label: 'Purple',
  },
  orange: {
    light: vars('25 95% 53%', '0 0% 100%', '25 80% 92%', '25 95% 30%', '25 95% 53%', '25 95% 53%', '0 0% 98%', '25 80% 95%', '25 95% 30%', '25 95% 53%'),
    dark: vars('25 95% 58%', '220 25% 8%', '25 50% 22%', '25 90% 75%', '25 95% 58%', '25 95% 58%', '220 25% 8%', '25 50% 18%', '25 90% 75%', '25 95% 58%'),
    swatch: '#ea580c',
    label: 'Orange',
  },
  green: {
    light: vars('142 71% 45%', '0 0% 100%', '142 50% 92%', '142 71% 28%', '142 71% 45%', '142 71% 45%', '0 0% 98%', '142 50% 95%', '142 71% 28%', '142 71% 45%'),
    dark: vars('142 71% 50%', '220 25% 8%', '142 40% 20%', '142 65% 70%', '142 71% 50%', '142 71% 50%', '220 25% 8%', '142 40% 18%', '142 65% 70%', '142 71% 50%'),
    swatch: '#16a34a',
    label: 'Green',
  },
};

const STORAGE_KEY = 'theme-color';

export function getStoredColorTheme(): ColorThemeId {
  if (typeof window === 'undefined') return 'teal';
  const stored = localStorage.getItem(STORAGE_KEY) as ColorThemeId | null;
  if (stored && stored in COLOR_THEMES) return stored;
  return 'teal';
}

export function setStoredColorTheme(id: ColorThemeId): void {
  localStorage.setItem(STORAGE_KEY, id);
}

export function applyColorTheme(id: ColorThemeId, isDark: boolean): void {
  const root = document.documentElement;
  const preset = COLOR_THEMES[id];
  const vars_ = isDark ? preset.dark : preset.light;
  root.style.setProperty('--primary', vars_.primary);
  root.style.setProperty('--primary-foreground', vars_.primaryForeground);
  root.style.setProperty('--accent', vars_.accent);
  root.style.setProperty('--accent-foreground', vars_.accentForeground);
  root.style.setProperty('--ring', vars_.ring);
  root.style.setProperty('--sidebar-primary', vars_.sidebarPrimary);
  root.style.setProperty('--sidebar-primary-foreground', vars_.sidebarPrimaryForeground);
  root.style.setProperty('--sidebar-accent', vars_.sidebarAccent);
  root.style.setProperty('--sidebar-accent-foreground', vars_.sidebarAccentForeground);
  root.style.setProperty('--sidebar-ring', vars_.sidebarRing);
}
