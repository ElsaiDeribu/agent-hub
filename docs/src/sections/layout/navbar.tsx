import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { GitHub } from '@/assets/icons';
import { Logo } from '@/assets/logo/logo';
import { Button } from '@/components/ui/button';
import { Link, NavLink } from 'react-router-dom';
import { ThemeToggleIcon } from '@/theme/components/theme-toggle';

const GITHUB_URL = 'https://github.com/ElsaiDeribu/agent-hub';

const NAV_LINKS = [
  { label: 'Agents', to: paths.agents },
  { label: 'Docs', to: paths.docs.root },
] as const;

export function Navbar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 shrink-0 border-b bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <nav className="flex h-16 w-full items-center justify-between px-4 lg:px-6">
        <Link to={paths.home} className="flex items-center">
          <Logo variant="full" className="h-10" />
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Button key={link.to} variant="ghost" size="sm" asChild>
              <NavLink
                to={link.to}
                className={({ isActive }) => cn(isActive && 'bg-accent text-accent-foreground')}
              >
                {link.label}
              </NavLink>
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GitHub className="size-4 fill-current" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>

          <ThemeToggleIcon />
        </nav>
      </nav>
    </header>
  );
}
