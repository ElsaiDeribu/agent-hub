import { Github } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/sections/dashboard/app-sidebar';
import { ThemeToggleIcon } from '@/theme/components/theme-toggle';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-end gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-1 pr-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://github.com/ElsaiDeribu/agent-hub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                <span className="hidden sm:inline text-xs">GitHub</span>
              </a>
            </Button>
            <ThemeToggleIcon />
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
