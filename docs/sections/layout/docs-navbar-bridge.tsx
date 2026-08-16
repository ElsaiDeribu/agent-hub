"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavbar } from "@/sections/layout/navbar-context";

/** Registers the docs sidebar toggle with the root navbar (must run inside SidebarProvider). */
export function DocsNavbarBridge() {
  const { toggleSidebar } = useSidebar();
  const { sidebarToggleRef } = useNavbar();

  useEffect(() => {
    sidebarToggleRef.current = toggleSidebar;
    return () => {
      sidebarToggleRef.current = null;
    };
  }, [toggleSidebar, sidebarToggleRef]);

  return null;
}
