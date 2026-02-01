import { useEffect, useState } from 'react';
import {
  COLOR_THEMES,
  getStoredColorTheme,
  setStoredColorTheme,
  applyColorTheme,
  type ColorThemeId,
} from '@/lib/colorThemes';

type ThemeMode = 'light' | 'dark';

export function useColorTheme(theme: ThemeMode) {
  const [color, setColorState] = useState<ColorThemeId>(() => getStoredColorTheme());

  useEffect(() => {
    applyColorTheme(color, theme === 'dark');
  }, [color, theme]);

  const setColor = (id: ColorThemeId) => {
    setStoredColorTheme(id);
    setColorState(id);
  };

  return { color, setColor, themes: COLOR_THEMES };
}
