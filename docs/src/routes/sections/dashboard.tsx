import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/loading-screen';

// ----------------------------------------------------------------------

const DashboardLayout = lazy(() => import('@/pages/dashboard/dashboard'));
const DashboardIndexPage = lazy(() => import('@/pages/dashboard/dashboard-index'));
const DashboardAgentDetailPage = lazy(() => import('@/pages/dashboard/dashboard-agent-detail'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      // <AuthGuard>
      <Suspense fallback={<LoadingScreen />}>
        <DashboardLayout />
      </Suspense>
      // </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardIndexPage /> },
      { path: 'agents/:name', element: <DashboardAgentDetailPage /> },
    ],
  },
];
