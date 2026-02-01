import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage.js';
import { HomePage } from '@/features/dashboard/pages/HomePage.js';
import { ProtectedRoute } from './ProtectedRoute.js';

// ============================================================================
// APP ROUTER CONFIGURATION
// ============================================================================

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <HomePage />,
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
