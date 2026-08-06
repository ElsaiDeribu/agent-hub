import Link from "next/link";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

const GITHUB_URL = "https://github.com/ElsaiDeribu/agent-hub";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-auto border-t", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <p>Built with ❤️ by AgentHub</p>
        <div className="flex gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <Link href={paths.docs.root} className="hover:text-foreground transition-colors">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
