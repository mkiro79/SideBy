/**
 * ErrorBoundary - Componente de clase para capturar errores de React en el árbol
 *
 * Captura errores de JavaScript en cualquier componente hijo del árbol
 * y muestra la ErrorPage en su lugar, evitando pantallas en blanco
 * o el objeto [object Object] mostrado directamente.
 *
 * Uso:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Componente alternativo personalizado (opcional). Por defecto muestra el fallback interno. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Solo logueamos en desarrollo
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Uncaught error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    // Navegación forzada fuera del contexto de React Router usando replace para no agregar al historial
    window.location.replace('/home');
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Si se pasa un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto: igual que ErrorPage pero sin dependencia del router
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

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

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button
              onClick={this.handleGoHome}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Volver al inicio
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
