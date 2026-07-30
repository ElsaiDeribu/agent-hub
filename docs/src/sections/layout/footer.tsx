import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/ElsaiDeribu/agent-hub';

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn('border-t mt-16', className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>Built with ❤️ by agent-hub</p>
        <div className="flex gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <Link to={paths.docs.root} className="hover:text-foreground transition-colors">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
