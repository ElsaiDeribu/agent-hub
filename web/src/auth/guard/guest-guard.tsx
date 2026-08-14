import { useEffect, useCallback } from 'react';
import { SplashScreen } from '@/components/loading-screen';
import { useRouter } from '@/routes/hooks';
import { PATH_AFTER_LOGIN } from '@/config-global';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function GuestGuard({ children }: Props) {
  const { loading } = useAuthContext();

  return <>{loading ? <SplashScreen /> : <Container>{children}</Container>}</>;
}

// ----------------------------------------------------------------------

function Container({ children }: Props) {
  const router = useRouter();

  const { authenticated } = useAuthContext();

  const check = useCallback(() => {
    if (authenticated) {
      router.replace(PATH_AFTER_LOGIN);
    }
  }, [authenticated, router]);

  useEffect(() => {
    check();
  }, [check]);

  return <>{children}</>;
}
