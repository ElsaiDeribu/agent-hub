import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { paths } from '@/routes/paths';

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href={paths.home} className="flex items-center self-center">
          <Logo variant="full" className="h-8" />
        </Link>
        {children}
      </div>
    </div>
  );
}
