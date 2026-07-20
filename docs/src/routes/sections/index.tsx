import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { LoadingScreen } from '@/components/loading-screen';

// import { PATH_AFTER_LOGIN } from 'src/config-global';
import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { docsRoutes } from './docs';

const HomePage = lazy(() => import('@/pages/home/home'));
const AgentsPage = lazy(() => import('@/pages/agents/agents'));

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

    // Agents
    {
      path: '/agents',
      element: (
        <Suspense fallback={<LoadingScreen />}>
          <AgentsPage />
        </Suspense>
      ),
    },

    // Auth routes
    ...authRoutes,

    // Main routes (error pages)
    ...mainRoutes,

    // Docs
    ...docsRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
