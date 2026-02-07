import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage.js';
import { Landing } from '@/features/public/pages/Landing.js';
import Home from '@/features/dashboard/pages/Home.js';
import { DatasetsList } from '@/features/dataset/pages/DatasetsList.js';
import DataUploadWizard from '@/features/dataset/pages/DataUploadWizard.js';
import { ProtectedRoute } from './ProtectedRoute.js';

// ============================================================================
// APP ROUTER CONFIGURATION
// ============================================================================

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
  {
    path: '/datasets',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <DatasetsList />,
      },
      {
        path: 'upload',
        element: <DataUploadWizard />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
