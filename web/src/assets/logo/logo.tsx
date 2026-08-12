import { cn } from '@/lib/utils';
import logoMarkDark from '@/assets/agent-hub-logo-dark.svg';
import logoMarkLight from '@/assets/agent-hub-logo-light.svg';
import logoFullDark from '@/assets/agent-hub-logo-full-dark.svg';
import logoFullLight from '@/assets/agent-hub-logo-full-light.svg';

type LogoProps = {
  /** `mark` = icon only; `full` = icon + company name */
  variant?: 'mark' | 'full';
  className?: string;
  alt?: string;
};

const SOURCES = {
  mark: { dark: logoMarkDark, light: logoMarkLight },
  full: { dark: logoFullDark, light: logoFullLight },
} as const;

export function Logo({ variant = 'mark', className, alt = 'AgentHub' }: LogoProps) {
  const { dark, light } = SOURCES[variant];

  return (
    <span className={cn('relative inline-flex shrink-0 items-center', className)}>
      {/* dark artwork → light mode; light artwork → dark mode */}
      <img src={dark} alt={alt} className="h-full w-auto dark:hidden" />
      <img src={light} alt="" aria-hidden className="hidden h-full w-auto dark:block" />
    </span>
  );
}
