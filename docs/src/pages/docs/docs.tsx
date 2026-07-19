import { Outlet } from 'react-router-dom';
import { DocsHeader } from '@/sections/docs/docs-header';
import { AppSidebar } from '@/sections/docs/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function DocsLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <DocsHeader className="h-16" />
      <SidebarProvider>
        <AppSidebar className="top-16! h-[calc(100svh-4rem)]!" />
        <SidebarInset>
          <main className="flex justify-center items-center">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
