/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.js';

// ============================================================================
// LAZY LOADED PAGES
// ============================================================================

// Public pages
const Landing = lazy(() => import('@/features/public/pages/Landing.js'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage.js').then(m => ({ default: m.LoginPage })));

// Protected pages  
const Home = lazy(() => import('@/features/home/pages/Home.js'));
const DatasetsList = lazy(() => import('@/features/dataset/pages/DatasetsList.js'));
const DataUploadWizard = lazy(() => import('@/features/dataset/pages/DataUploadWizard.js'));
const DatasetDetail = lazy(() => import('@/features/dataset/pages/DatasetDetail.js'));
const DatasetDashboard = lazy(() => import('@/features/dataset/pages/DatasetDashboard.js'));

// ============================================================================
// LOADING FALLBACK
// ============================================================================

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

// ============================================================================
// APP ROUTER CONFIGURATION
// ============================================================================

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: '/home',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/datasets',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DatasetsList />
          </Suspense>
        ),
      },
      {
        path: 'upload',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DataUploadWizard />
          </Suspense>
        ),
      },
      {
        path: ':id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DatasetDetail />
          </Suspense>
        ),
      },
      {
        path: ':id/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DatasetDashboard />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
