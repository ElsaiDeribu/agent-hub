import Image from "next/image";
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
    width: 154,
    height: 155,
  },
  full: {
    dark: "/branding/agent-hub-logo-full-dark.svg",
    light: "/branding/agent-hub-logo-full-light.svg",
    width: 464,
    height: 130,
  },
} as const;

export function Logo({
  variant = "mark",
  className,
  alt = "AgentHub",
}: LogoProps) {
  const { dark, light, width, height } = SOURCES[variant];

  return (
    <span className={cn("relative inline-flex shrink-0 items-center", className)}>
      <Image
        src={dark}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-auto dark:hidden"
        priority
      />
      <Image
        src={light}
        alt=""
        aria-hidden
        width={width}
        height={height}
        className="hidden h-full w-auto dark:block"
        priority
      />
    </span>
  );
}
