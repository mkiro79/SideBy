import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { appRouter } from './router/AppRouter.js';
import { Toaster } from '@/shared/components/Toaster.js';

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
    <GoogleOAuthProvider clientId={googleClientId}>
      <RouterProvider router={appRouter} />
      <Toaster />
    </GoogleOAuthProvider>
  );
}

export default App;
