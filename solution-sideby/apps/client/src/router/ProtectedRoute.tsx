import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store.js';

// ============================================================================
// PROTECTED ROUTE WRAPPER
// ============================================================================

/**
 * Componente que protege rutas privadas
 * Si el usuario NO está autenticado, redirige a /login
 */
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  // Renderizar las rutas hijas si está autenticado
  return <Outlet />;
};
