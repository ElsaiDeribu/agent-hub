"use client";

import type { Theme } from "@/components/theme/types";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

const CYCLE: Theme[] = ["light", "dark"];

const ICONS: Partial<Record<Theme, React.ReactNode>> = {
  light: <Sun className="size-5" />,
  dark: <Moon className="size-5" />,
};

const toggleClassName =
  "inline-flex size-9 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer";

const emptySubscribe = () => () => {};

/** false during SSR + hydration; true only after client commit. */
function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Compact icon button that cycles light → dark → light */
export function ThemeToggleIcon() {
  const isClient = useIsClient();
  const { theme, setTheme } = useTheme();

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];
    setTheme(next);
  }

  // Same markup on server and first client paint — theme is only known on client.
  if (!isClient) {
    return (
      <button type="button" aria-label="Switch theme" className={toggleClassName} disabled />
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Switch theme (current: ${theme})`}
      className={toggleClassName}
    >
      {ICONS[theme]}
    </button>
  );
}

/** full toggle */
export const ThemeToggle = () => {
  const isClient = useIsClient();
  const { theme, setTheme } = useTheme();
  const themes: Theme[] = ["light", "dark", "blue"];

  if (!isClient) {
    return <div className="flex gap-2" />;
  }

  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          className={`px-4 py-2 rounded-md ${
            theme === t
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
