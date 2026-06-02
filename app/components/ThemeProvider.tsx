'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const initial = saved ?? 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    toggle();
    setTimeout(() => setSpinning(false), 500);
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Cambiar tema"
      style={{ transition: 'background 0.3s' }}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white overflow-hidden relative"
    >
      <span
        style={{
          display: 'inline-flex',
          transform: spinning ? 'rotate(360deg) scale(1.3)' : 'rotate(0deg) scale(1)',
          opacity: spinning ? 0.6 : 1,
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s',
        }}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </span>
    </button>
  );
}
