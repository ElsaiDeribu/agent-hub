"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { Logo } from "@/components/icons/logo";
import GitHub from "@/components/icons/github-icon";
import { ThemeToggleIcon } from "@/components/theme/components/theme-toggle";
import { useNavbar } from "@/sections/layout/navbar-context";

const GITHUB_URL = "https://github.com/ElsaiDeribu/agent-hub";

const NAV_LINKS = [
  { label: "Agents", href: paths.agents },
  { label: "Docs", href: paths.docs.root },
] as const;

const AUTH_PREFIXES = [paths.auth.signIn, paths.auth.signUp, paths.auth.verifyEmail] as const;

const navLinkClassName =
  "text-[15px] font-medium leading-none text-muted-foreground transition-colors duration-200 hover:text-foreground";

export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { sidebarToggleRef } = useNavbar();

  const isHidden = AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isIsland = pathname === paths.home;
  const showSidebarTrigger = pathname.startsWith(paths.docs.root);

  if (isHidden) {
    return null;
  }

  return (
    <header
      className={cn(
        "z-50 shrink-0 transition-[top,padding] duration-300 ease-in-out motion-reduce:transition-none",
        isIsland
          ? "pointer-events-none fixed inset-x-0 top-0 px-3 pt-3 sm:px-4 sm:pt-4 md:px-6"
          : "sticky top-0 px-0",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between transition-[max-width,height,border-radius,background-color,box-shadow,border-color,padding] duration-300 ease-in-out motion-reduce:transition-none",
          isIsland
            ? "pointer-events-auto h-16 max-w-5xl rounded-2xl border border-border/60 bg-background/95 px-5 shadow-sm backdrop-blur-md sm:px-6"
            : "h-16 max-w-full rounded-none border-b border-border bg-background/80 px-4 shadow-none backdrop-blur-sm lg:px-6",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {showSidebarTrigger ? (
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => sidebarToggleRef.current?.()}
              className="inline-flex size-9 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground md:hidden"
            >
              <PanelLeftIcon className="size-5" />
            </button>
          ) : null}
          <Link href={paths.home} className="inline-flex shrink-0 items-center">
            <Logo variant="full" className={cn(isIsland ? "h-9" : "h-10")} />
          </Link>
        </div>

        <div className="flex items-center gap-5 sm:gap-6">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  navLinkClassName,
                  isActive && "text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(navLinkClassName, "inline-flex items-center gap-1.5")}
          >
            <GitHub className="size-[18px] fill-current" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <ThemeToggleIcon />
        </div>
      </div>
    </header>
  );
}
