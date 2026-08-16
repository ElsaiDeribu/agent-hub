import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Steps({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="steps"
      className={cn(
        "steps mb-12 [counter-reset:step] md:ml-4 md:border-l md:pl-8 [&>h2]:step [&>h2]:mt-8! [&>h2]:border-0! [&>h2]:pb-0! [&>h2]:text-lg! [&>h2]:font-medium! [&>h2:first-child]:mt-0! [&>h3]:step",
        className,
      )}
      {...props}
    />
  );
}

function Step({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
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
