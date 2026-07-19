import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/loading-screen';

// ----------------------------------------------------------------------

const DocsLayout = lazy(() => import('@/pages/docs/docs'));
const DocsAgentDetailPage = lazy(() => import('@/pages/docs/docs-agent-detail'));
const DocsIntroductionPage = lazy(() => import('@/pages/docs/docs-introduction'));
const DocsInstallationPage = lazy(() => import('@/pages/docs/docs-installation'));

// ----------------------------------------------------------------------

export const docsRoutes = [
  {
    path: 'docs',
    element: (
      // <AuthGuard>
      <Suspense fallback={<LoadingScreen />}>
        <DocsLayout />
      </Suspense>
      // </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="introduction" replace /> },
      { path: 'introduction', element: <DocsIntroductionPage /> },
      { path: 'installation', element: <DocsInstallationPage /> },
      { path: 'agents/:name', element: <DocsAgentDetailPage /> },
    ],
  },
];
