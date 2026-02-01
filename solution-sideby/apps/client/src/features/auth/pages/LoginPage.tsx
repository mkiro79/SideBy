import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.js';
import { Input } from '@/shared/components/ui/Input.js';
import { Label } from '@/shared/components/ui/Label.js';
import { Separator } from '@/shared/components/ui/Separator.js';
import { useGoogleAuth } from '../hooks/useGoogleAuth.js';
import { useAuthStore } from '../store/auth.store.js';

// ============================================================================
// FEATURE FLAGS
// ============================================================================
const ENABLE_EMAIL_LOGIN = false; // TODO: Cambiar a true cuando implementes login por email

// ============================================================================
// LOGIN PAGE
// ============================================================================

export const LoginPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { handleGoogleSuccess, handleGoogleError, isLoading, error, clearError } = useGoogleAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        {/* Card Elevado según VISUAL_COMPONENTS_REFERENCE */}
        <Card className="border-0 shadow-xl">
          {/* Logo y Branding */}
          <CardHeader className="space-y-3 text-center pb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80">
              <BarChart3 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">SideBy</CardTitle>
              <CardDescription>
                Inicia sesión para acceder a tus reportes y comparativas
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-medium">Error al iniciar sesión</p>
                <p className="mt-1 text-xs opacity-90">{error}</p>
              </div>
            )}

            {/* Google Login Button - Componente oficial */}
            <div className="flex w-full justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with"
                size="large"
                width="100%"
              />
            </div>

            {/* Separator con texto superpuesto - VISUAL_COMPONENTS_REFERENCE */}
            {ENABLE_EMAIL_LOGIN && (
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase">
                  O con email
                </span>
              </div>
            )}

            {/* Email/Password Form - Feature Flag */}
            {ENABLE_EMAIL_LOGIN && (
              <form className="space-y-4">
                {/* Input con icono left-positioned - VISUAL_COMPONENTS_REFERENCE */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="h-11 pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password con toggle - VISUAL_COMPONENTS_REFERENCE */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
              </form>
            )}

            {/* Footer Links */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Al continuar, aceptas nuestros{' '}
                <a href="/terms" className="text-primary hover:underline">
                  Términos de Servicio
                </a>
                {' y '}
                <a href="/privacy" className="text-primary hover:underline">
                  Política de Privacidad
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
