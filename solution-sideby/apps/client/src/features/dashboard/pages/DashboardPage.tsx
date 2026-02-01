import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.js';
import { useAuthStore } from '@/features/auth/store/auth.store.js';

// ============================================================================
// DASHBOARD PAGE (Temporal - para testing)
// ============================================================================

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido de vuelta</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Usuario
            </CardTitle>
            <CardDescription>
              Datos obtenidos de tu cuenta de Google
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.avatar && (
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-16 w-16 rounded-full border-2 border-border"
                />
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="font-semibold">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                <p className="font-semibold capitalize">{user.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
            </div>

            <div className="rounded-lg bg-data-primary/10 p-3 text-sm">
              <p className="font-medium text-data-primary">✅ Autenticación exitosa</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tu sesión está guardada en localStorage y persistirá al recargar la página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
