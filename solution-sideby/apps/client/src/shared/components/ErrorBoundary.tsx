/**
 * ErrorBoundary - Captura errores React no manejados a nivel de árbol de componentes.
 *
 * Envuelve el árbol de la aplicación para evitar pantallas en blanco.
 * Cuando ocurre un error de renderizado, renderiza el `fallback` proporcionado o,
 * en su defecto, una pantalla de error embebida con opción de volver al inicio.
 */

import { Component, type ReactNode, type ErrorInfo } from "react";

// ============================================================================
// TIPOS
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// ERROR BOUNDARY (Clase requerida por React)
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En producción aquí iría Sentry.captureException(error, { extra: info })
    console.error("[ErrorBoundary] Error capturado:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Permite inyectar un fallback personalizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto: ErrorPage embebida sin router
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              ¡Vaya! Algo ha ocurrido de manera inesperada.
            </h1>
            <p className="text-sm text-muted-foreground">
              Se ha producido un error inesperado. Por favor, recarga la página.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.replace("/home")}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Volver al inicio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
