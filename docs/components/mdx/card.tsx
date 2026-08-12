import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bot,
  Globe,
  Layers,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const ICONS = {
  bot: Bot,
  layers: Layers,
  zap: Zap,
  globe: Globe,
} as const;

type IconName = keyof typeof ICONS;

type CardsProps = {
  children?: ReactNode;
  cols?: 2 | 3;
  className?: string;
};

export function Cards({ children, cols = 2, className }: CardsProps) {
  return (
    <div
      className={cn(
        "my-6 grid gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

type CardProps = {
  title?: string;
  icon?: IconName;
  badge?: boolean;
  badgeClassName?: string;
  href?: string;
  action?: string;
  children?: ReactNode;
  className?: string;
};

export function Card({
  title,
  icon,
  badge = false,
  badgeClassName,
  href,
  action,
  children,
  className,
}: CardProps) {
  const Icon: LucideIcon | undefined = icon ? ICONS[icon] : undefined;

  if (action && href) {
    return (
      <UiCard
        className={cn(
          "my-6 gap-0 border bg-primary/5 py-0 shadow-none",
          className
        )}
      >
        <CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            {title ? (
              <p className="mb-1 font-medium text-foreground">{title}</p>
            ) : null}
            {children ? (
              <div className="text-sm text-muted-foreground [&_p]:m-0">
                {children}
              </div>
            ) : null}
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href={href} className="flex items-center gap-1.5">
              {action}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </UiCard>
    );
  }

  const header = badge ? (
    <Badge className={badgeClassName} variant="outline">
      {title}
    </Badge>
  ) : title ? (
    <p className="mb-1 font-medium text-foreground">{title}</p>
  ) : null;

  const body = children ? (
    <div
      className={cn(
        "leading-relaxed text-muted-foreground [&_p]:m-0",
        badge ? "text-xs" : "text-sm"
      )}
    >
      {children}
    </div>
  ) : null;

  return (
    <UiCard
      className={cn(
        "gap-0 py-0 transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardContent
        className={cn(
          "flex items-start p-5",
          Icon || badge ? "gap-3" : undefined,
          badge && "p-4"
        )}
      >
        {Icon ? (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
        ) : null}
        <div className={cn(badge && "flex min-w-0 flex-1 flex-col gap-2")}>
          {header}
          {body}
        </div>
      </CardContent>
    </UiCard>
  );
}
