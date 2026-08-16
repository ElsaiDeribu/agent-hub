import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getDocsNav } from "@/lib/page-tree";
import { AppSidebar } from "@/sections/docs/app-sidebar";
import { Navbar } from "@/sections/layout/navbar";
import type { ReactNode } from "react";

export default function DocsLayout({ children }: { children: ReactNode }) {
  const navItems = getDocsNav();

  return (
    <SidebarProvider className="flex min-h-svh w-full flex-col">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <AppSidebar
          items={navItems}
          className="top-16! h-[calc(100svh-4rem)]!"
        />
        <SidebarInset className="min-w-0">
          <div className="w-full px-6 py-10 lg:px-10">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
