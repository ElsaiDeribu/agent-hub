"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/icons/logo";
import GitHub from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggleIcon } from "@/components/theme/components/theme-toggle";

const GITHUB_URL = "https://github.com/ElsaiDeribu/agent-hub";

const NAV_LINKS = [{ label: "Docs", href: "/docs" }] as const;

export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 shrink-0 border-b bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <nav className="flex h-16 w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-10" />
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(isActive && "bg-accent text-accent-foreground")}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}

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
