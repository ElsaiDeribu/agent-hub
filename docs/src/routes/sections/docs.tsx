import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/loading-screen';

// ----------------------------------------------------------------------

const DocsLayout = lazy(() => import('@/pages/docs/docs'));
const DocsIndexPage = lazy(() => import('@/pages/docs/docs-index'));
const DocsAgentDetailPage = lazy(() => import('@/pages/docs/docs-agent-detail'));

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
      { index: true, element: <DocsIndexPage /> },
      { path: 'agents/:name', element: <DocsAgentDetailPage /> },
    ],
  },
];
