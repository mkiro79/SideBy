import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card.js';
import { Input } from '@/shared/components/ui/Input.js';
import { Label } from '@/shared/components/ui/Label.js';
import { Separator } from '@/shared/components/ui/Separator.js';
import { useGoogleAuth } from '../hooks/useGoogleAuth.js';
import { useAuthStore } from '../store/auth.store.js';

// ============================================================================
// FEATURE FLAGS
// ============================================================================
const ENABLE_EMAIL_LOGIN = false;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Card con elevación y bordes suaves según Style Guide */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-sm">
          {/* Logo y Branding - Spacing según 8px grid */}
          <CardHeader className="space-y-6 text-center pb-8 pt-10">
            {/* Logo con gradiente brand */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
              <BarChart3 className="h-10 w-10 text-white" strokeWidth={2} />
            </div>
            
            {/* Títulos con tipografía Geist */}
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                SideBy
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Inicia sesión para acceder a tus reportes y comparativas
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-10 px-8">
            {/* Error Alert - Semantic colors */}
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm animate-in fade-in-0 slide-in-from-top-2 duration-300">
                <p className="font-semibold text-red-900 dark:text-red-200">
                  Error al iniciar sesión
                </p>
                <p className="mt-1.5 text-sm text-red-700 dark:text-red-300/90">
                  {error}
                </p>
              </div>
            )}

            {/* Google Login Button Container */}
            <div className="flex w-full justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with"
                size="large"
                width="368"
              />
            </div>

            {/* Separator con texto - Visual hierarchy */}
            {ENABLE_EMAIL_LOGIN && (
              <div className="relative my-8">
                <Separator className="bg-slate-200 dark:bg-slate-800" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  O con email
                </span>
              </div>
            )}

            {/* Email/Password Form */}
            {ENABLE_EMAIL_LOGIN && (
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                {/* Email Input - Icon + Input pattern */}
                <div className="space-y-2.5">
                  <Label 
                    htmlFor="email" 
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Correo electrónico
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="h-12 pl-12 pr-4 text-base rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input - Icon + Toggle pattern */}
                <div className="space-y-2.5">
                  <Label 
                    htmlFor="password" 
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Contraseña
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-12 pl-12 pr-12 text-base rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:text-blue-600 dark:focus:text-blue-400"
                      disabled={isLoading}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button - Primary action */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando sesión...
                    </span>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer Links - Muted text hierarchy - Fuera de la Card */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-6 px-4">
          <p>
            Al continuar, aceptas nuestros{' '}
            <a 
              href="/terms" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 font-medium transition-colors"
            >
              Términos de Servicio
            </a>
            {' y '}
            <a 
              href="/privacy" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 font-medium transition-colors"
            >
              Política de Privacidad
            </a>              
          </p>
        </div>
      </div>
    </div>
  );
};