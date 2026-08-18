import { Suspense } from 'react';
import VerifyEmailView from '@/sections/auth/verify-email-view';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailView />
    </Suspense>
  );
}
