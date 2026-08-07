import { CliCommand } from "@/components/cli-command";
import { Step, Steps } from "@/components/ui/steps";
import { cn } from "@/lib/utils";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentProps } from "react";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    h2: ({ className, ...props }: ComponentProps<"h2">) => (
      <h2
        className={cn(
          "mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0",
          className
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }: ComponentProps<"h3">) => (
      <h3
        className={cn(
          "mt-8 scroll-m-20 text-lg font-semibold tracking-tight",
          className
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }: ComponentProps<"p">) => (
      <p
        className={cn(
          "leading-relaxed text-muted-foreground [&:not(:first-child)]:mt-4",
          className
        )}
        {...props}
      />
    ),
    a: ({ className, href, ...props }: ComponentProps<"a">) => {
      const classNames = cn(
        "font-medium text-foreground underline underline-offset-4 hover:text-primary",
        className
      );

      if (href?.startsWith("/")) {
        return <Link href={href} className={classNames} {...props} />;
      }

      return (
        <a
          href={href}
          className={classNames}
          target={href?.startsWith("http") ? "_blank" : undefined}
          rel={href?.startsWith("http") ? "noreferrer" : undefined}
          {...props}
        />
      );
    },
    ul: ({ className, ...props }: ComponentProps<"ul">) => (
      <ul
        className={cn("my-4 ml-6 list-disc text-muted-foreground", className)}
        {...props}
      />
    ),
    ol: ({ className, ...props }: ComponentProps<"ol">) => (
      <ol
        className={cn(
          "my-4 ml-6 list-decimal text-muted-foreground",
          className
        )}
        {...props}
      />
    ),
    li: ({ className, ...props }: ComponentProps<"li">) => (
      <li className={cn("mt-2", className)} {...props} />
    ),
    strong: ({ className, ...props }: ComponentProps<"strong">) => (
      <strong
        className={cn("font-semibold text-foreground", className)}
        {...props}
      />
    ),
    code: ({ className, ...props }: ComponentProps<"code">) => {
      const isBlock = className?.includes("language-");

      if (isBlock) {
        return (
          <code className={cn("font-mono text-sm", className)} {...props} />
        );
      }

      return (
        <code
          className={cn(
            "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[0.8rem]",
            className
          )}
          {...props}
        />
      );
    },
    pre: ({ className, ...props }: ComponentProps<"pre">) => (
      <pre
        className={cn(
          "my-4 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-sm [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-sm",
          className
        )}
        {...props}
      />
    ),
    Steps,
    Step,
    CliCommand,
    ...components
  };
}
