import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { LoadingScreen } from '@/components/loading-screen';

// import { PATH_AFTER_LOGIN } from 'src/config-global';
import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';

const HomePage = lazy(() => import('@/pages/home/home'));

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    // SET INDEX PAGE WITH SKIP HOME PAGE
    // {
    //   path: '/',
    //   element: <Navigate to={PATH_AFTER_LOGIN} replace />,
    // },

    // ----------------------------------------------------------------------
    // Home
    {
      path: '/',
      element: (
        <Suspense fallback={<LoadingScreen />}>
          <HomePage />
        </Suspense>
      ),
    },

    // Auth routes
    ...authRoutes,

    // Main routes (error pages)
    ...mainRoutes,

    // Dashboard
    ...dashboardRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
