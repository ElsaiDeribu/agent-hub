import type { Theme } from '@/theme/types';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/theme/theme-provider';

const CYCLE: Theme[] = ['light', 'dark'];

const ICONS: Partial<Record<Theme, React.ReactNode>> = {
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
};

/** Compact icon button that cycles light → dark → light */
export function ThemeToggleIcon() {
  const { theme, setTheme } = useTheme();

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];
    setTheme(next);
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Switch theme (current: ${theme})`}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
    >
      {ICONS[theme]}
    </button>
  );
}

/** full toggle */
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const themes: Theme[] = ['light', 'dark', 'blue'];

  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-4 py-2 rounded-md ${
            theme === t
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
