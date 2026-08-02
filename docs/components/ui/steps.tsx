import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Steps({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="steps"
      className={cn(
        "steps mb-12 [counter-reset:step] md:ml-4 md:border-l md:pl-8 [&>h3]:step",
        className,
      )}
      {...props}
    />
  );
}

function Step({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="step"
      className={cn(
        "mt-8 scroll-m-32 text-lg font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export { Step, Steps };
