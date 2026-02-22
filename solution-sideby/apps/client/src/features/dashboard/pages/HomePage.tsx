import { LogOut, User, BarChart3 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card.js';
import { useAuthStore } from '@/features/auth/store/auth.store.js';
import { useLogout } from '@/features/auth/hooks/useLogout.js';
import { SideByWordmark } from '@/shared/components/SideByWordmark.js';

// ============================================================================
// HOME PAGE (Pantalla Principal después del Login)
// ============================================================================

export const HomePage = () => {
  const { user } = useAuthStore();
  const logout = useLogout();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold"><SideByWordmark /></h1>
              <p className="text-xs text-muted-foreground">Analytics Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-10 w-10 rounded-full border-2 border-border"
              />
            )}
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Hello, {user.name.split(' ')[0]} 👋
            </h2>
            <p className="text-muted-foreground">
              Welcome to your comparative analysis platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Datasets</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  No datasets loaded yet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reportes</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Create your first comparative report
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comparaciones</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Pending analysis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Session Information
              </CardTitle>
              <CardDescription>
                Your Google-authenticated account data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rol</p>
                  <p className="font-semibold capitalize">{user.role}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>
              </div>

              <div className="rounded-lg bg-data-primary/10 p-3 text-sm">
                <p className="font-medium text-data-primary">✅ Active Session</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your session is protected and will persist when you reload the page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
