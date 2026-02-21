/**
 * ErrorPage - Página de error global de la aplicación
 *
 * Se muestra cuando ocurre un error inesperado que rompe el rendering
 * de una ruta completa. Accesible desde el ErrorBoundary y el errorElement
 * del router de React Router v6.
 *
 * Comportamiento:
 * - Muestra un mensaje amigable al usuario
 * - Ofrece un botón para volver a /home
 * - No expone detalles técnicos del error al usuario final
 */

import { useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button.js';

// ============================================================================
// COMPONENT
// ============================================================================

export function ErrorPage() {
  const navigate = useNavigate();
  // useRouteError captura el error lanzado por React Router v6
  const routeError = useRouteError();

  // Solo logueamos en desarrollo para no exponer info sensible
  if (import.meta.env.DEV && routeError) {
    console.error('[ErrorPage] Route error:', routeError);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Icono de alerta */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>

      {/* Mensaje principal */}
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
        ¡Vaya!
      </h1>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Algo ha ocurrido de manera inesperada
      </h2>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        Se ha producido un error inesperado. Puedes intentar volver al inicio
        o recargar la página.
      </p>

      {/* Acciones */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button
          size="lg"
          onClick={() => navigate('/home', { replace: true })}
        >
          Volver al inicio
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Recargar página
        </Button>
      </div>
    </div>
  );
}

export default ErrorPage;
