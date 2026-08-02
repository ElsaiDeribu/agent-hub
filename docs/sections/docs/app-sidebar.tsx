"use client";

import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import type { DocsNavItem } from "@/lib/page-tree";
import { NavMain } from "@/sections/docs/nav-main";
import type { ComponentProps } from "react";

export function AppSidebar({
  items,
  ...props
}: ComponentProps<typeof Sidebar> & { items: DocsNavItem[] }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
