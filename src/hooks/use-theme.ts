import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme !== 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setThemeState(t => (t === 'light' ? 'dark' : 'light'));

  return { theme, setTheme: setThemeState, toggleTheme };
}
