/**
 * ErrorPage - Página de error global de SideBy
 *
 * Se muestra cuando una ruta falla como errorElement en React Router v6.
 * También puede usarse para manejar 404 u otros errores según la configuración del router.
 *
 * UX: Mensaje centrado + botón primario a /home.
 */

import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button.js";

// ============================================================================
// COMPONENT
// ============================================================================

export const ErrorPage = () => {
  const error = useRouteError();

  // Determina el mensaje de error según el tipo
  let message = "Ha ocurrido un error inesperado.";
  let statusText = "Error";

  if (isRouteErrorResponse(error)) {
    statusText = `${error.status} – ${error.statusText}`;
    if (error.status === 404) {
      message = "La página que buscas no existe.";
    } else if (error.status === 403) {
      message = "No tienes permiso para acceder a esta página.";
    } else {
      message = error.data?.message || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      {/* Icono */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>

      {/* Msg */}
      <div className="max-w-md space-y-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">{statusText}</p>
        <h1 className="text-2xl font-bold tracking-tight">
          ¡Vaya! Algo ha ocurrido de manera inesperada.
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      {/* Acción */}
      <Button asChild size="lg">
        <Link to="/home">Volver al inicio</Link>
      </Button>
    </div>
  );
};

export default ErrorPage;
