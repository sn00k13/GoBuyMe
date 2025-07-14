// utils/ThemeContext.js
import React, { createContext, useContext, useState } from 'react';
import COLORS from './colors';

const themes = {
  light: {
    ...COLORS,
    background: COLORS.backgroundLight,
    text: COLORS.textLight,
    cards: COLORS.cardsLight,
    borderBottom: COLORS.borderBottomLight,
  },
  dark: {
    ...COLORS,
    background: COLORS.backgroundDark,
    text: COLORS.textDark,
    cards: COLORS.cardsDark,
    borderBottom: COLORS.borderBottomDark,
  },
};

const ThemeContext = createContext({
  theme: themes.light,
  mode: 'light',
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const theme = themes[mode];

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);