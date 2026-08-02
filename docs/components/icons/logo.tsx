import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "mark" | "full";
  className?: string;
  alt?: string;
};

const SOURCES = {
  mark: {
    dark: "/branding/agent-hub-logo-dark.svg",
    light: "/branding/agent-hub-logo-light.svg",
  },
  full: {
    dark: "/branding/agent-hub-logo-full-dark.svg",
    light: "/branding/agent-hub-logo-full-light.svg",
  },
} as const;

export function Logo({
  variant = "mark",
  className,
  alt = "Agent Hub",
}: LogoProps) {
  const { dark, light } = SOURCES[variant];

  return (
    <span className={cn("relative inline-flex shrink-0 items-center", className)}>
      <img src={dark} alt={alt} className="h-full w-auto dark:hidden" />
      <img src={light} alt="" aria-hidden className="hidden h-full w-auto dark:block" />
    </span>
  );
}
