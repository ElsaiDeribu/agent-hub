import { paths } from '@/routes/paths';
import { Logo } from '@/assets/logo/logo';
import { RouterLink } from '@/routes/components';

export default function AuthLayoutMain({ children }: { children: React.ReactNode }) {
  const renderTerms = (
    <div className="text-muted-foreground text-center text-sm">
      By signing up, I agree to{' '}
      <RouterLink href={paths.auth.login} className="underline underline-offset-4">
        Terms of Service
      </RouterLink>{' '}
      and{' '}
      <RouterLink href={paths.auth.login} className="underline underline-offset-4">
        Privacy Policy
      </RouterLink>
      .
    </div>
  );
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center self-center">
          <Logo variant="full" className="h-8" />
        </a>
        {children}

        {renderTerms}
      </div>
    </div>
  );
}
