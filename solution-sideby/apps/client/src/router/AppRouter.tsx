import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage.js';
import Home from '@/features/dashboard/pages/Home.js';
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
        element: <Home />,
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
