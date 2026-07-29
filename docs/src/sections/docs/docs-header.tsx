import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { GitHub } from '@/assets/icons';
import { Logo } from '@/assets/logo/logo';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggleIcon } from '@/theme/components/theme-toggle';

export function DocsHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'sticky px-5 top-0 z-30 flex w-full shrink-0 items-center justify-between gap-2 border-b bg-background',
        className
      )}
    >
      <NavLink to={paths.home} className="flex flex-row items-center gap-3">
        <Logo variant="full" className="h-8" />
        {/* <span className="text-sm text-muted-foreground">v1.0.3</span> */}
      </NavLink>

      <div className="flex items-center gap-1">
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
            <GitHub className="size-5 fill-current" />

            <span className="hidden sm:inline text-xs">GitHub</span>
          </a>
        </Button>
        <ThemeToggleIcon />
      </div>
    </header>
  );
}
