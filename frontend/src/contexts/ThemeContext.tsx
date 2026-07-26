// contexts/ThemeContext.tsx
//
// NOUVEAU FICHIER : hooks/index.ts, AppLayout.tsx et Settings.tsx importent
// tous `useTheme` / `ThemeContext` mais ce fichier n'existait pas dans le
// projet fourni. Il gère 3 modes (light/dark/system), persiste le choix en
// localStorage et calcule `resolvedTheme` (utilisé par AppLayout pour
// l'icône soleil/lune et par MapPage pour choisir le fond de carte clair/
// sombre). Login.tsx gérait jusqu'ici son propre thème en local
// (localStorage direct) de façon indépendante ; il est mis à jour pour
// utiliser ce contexte à la place, afin d'avoir une seule source de vérité.
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ThemeMode } from '../types';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'asecna_theme';

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored ?? 'system';
  });

  const [systemPref, setSystemPref] = useState<'light' | 'dark'>(getSystemPreference());

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPref(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemPref : theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
