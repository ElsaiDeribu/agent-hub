import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatusPageProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
};

export function StatusPage({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: StatusPageProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border bg-muted/40">
          <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
        </div>
      ) : null}

      <h1 className="max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
        {description}
      </p>

      {actions ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
