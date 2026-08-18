'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paths } from '@/routes/paths';
import { useAuthContext } from '@/auth/hooks';
import { getErrorMessage } from '@/auth/context/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCountdownSeconds } from '@/hooks/use-countdown';

const VERIFY_LINK_TTL_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;

// ----------------------------------------------------------------------

export default function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resendVerificationEmail } = useAuthContext();

  const email = searchParams.get('email')?.trim() ?? '';

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const { counting, countdown, startCountdown } = useCountdownSeconds(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (!email) {
      router.replace(paths.auth.signUp);
    }
  }, [email, router]);

  const handleResend = async () => {
    if (!email || counting) {
      return;
    }

    setResendLoading(true);
    setResendMessage('');
    try {
      await resendVerificationEmail?.(email);
      setResendMessage('Verification email sent.');
      startCountdown();
    } catch (error) {
      setResendMessage(getErrorMessage(error));
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <Card>
      <CardContent className="grid gap-6 pt-6 text-center text-sm">
        <div className="grid gap-2">
          <p className="text-muted-foreground">We&apos;ve sent a verification link to</p>
          <p className="text-base font-medium text-foreground">{email}</p>
        </div>

        <p className="text-muted-foreground">
          Click the link in the email to verify your address and continue.
        </p>

        <div className="grid gap-2">
          <p className="text-muted-foreground">Didn&apos;t receive the email?</p>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            disabled={resendLoading || counting}
            onClick={handleResend}
          >
            {resendLoading
              ? 'Sending…'
              : counting
                ? `Resend in ${countdown}s`
                : 'Resend verification email'}
          </Button>
          {!!resendMessage && <p className="text-muted-foreground">{resendMessage}</p>}
        </div>

        <p className="text-muted-foreground">
          The link expires in {VERIFY_LINK_TTL_MINUTES} minutes.
        </p>
      </CardContent>
    </Card>
  );
}
