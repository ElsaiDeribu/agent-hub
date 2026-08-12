import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { paths } from "@/routes/paths";
import { GuestGuard } from "@/auth/guard";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link href={paths.home} className="flex items-center self-center">
            <Logo variant="full" className="h-8" />
          </Link>
          {children}
          <p className="text-muted-foreground text-center text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
