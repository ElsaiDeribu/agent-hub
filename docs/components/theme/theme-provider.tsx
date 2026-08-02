"use client";

import type { ReactNode } from "react";

import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme
} from "next-themes";

import type { Theme } from "./types";

const THEMES: Theme[] = ["light", "dark", "blue"];

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={THEMES}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return {
    theme: (resolvedTheme ?? theme ?? "light") as Theme,
    setTheme: (next: Theme) => setTheme(next)
  };
}
