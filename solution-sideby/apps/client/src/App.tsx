import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { appRouter } from './router/AppRouter.js';
import { Toaster } from '@/shared/components/Toaster.js';
import { queryClient } from '@/infrastructure/api/queryClient.js';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary.js';

// Lazy load DevTools solo en desarrollo
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : null;

// ============================================================================
// APP COMPONENT
// ============================================================================

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-destructive/10">
        <div className="rounded-lg border border-destructive bg-background p-6 text-center">
          <h2 className="text-xl font-bold text-destructive">Error de Configuración</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            VITE_GOOGLE_CLIENT_ID no está configurado en las variables de entorno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <RouterProvider router={appRouter} />
          <Toaster />
        </GoogleOAuthProvider>
        
        {/* React Query DevTools - Lazy loaded solo en modo desarrollo */}
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
