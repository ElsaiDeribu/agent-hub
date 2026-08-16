"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type NavbarContextValue = {
  sidebarToggleRef: React.RefObject<(() => void) | null>;
};

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const sidebarToggleRef = useRef<(() => void) | null>(null);

  const value = useMemo(
    () => ({
      sidebarToggleRef,
    }),
    [],
  );

  return (
    <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbar must be used within NavbarProvider.");
  }
  return context;
}
