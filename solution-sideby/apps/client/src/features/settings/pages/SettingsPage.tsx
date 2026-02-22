import { SidebarProvider } from "@/shared/components/ui/sidebar.js";
import { AppSidebar } from "@/shared/components/AppSidebar.js";
import { MobileSidebarTrigger } from "@/shared/components/MobileSidebarTrigger.js";
import { useUserProfile } from "../hooks/useUserProfile.js";
import { PersonalInfoCard } from "../components/PersonalInfoCard.js";
import { DangerZoneCard } from "../components/DangerZoneCard.js";

/**
 * Página de configuración de la cuenta.
 * Muestra el perfil del usuario y las opciones de gestión de cuenta.
 */
const SettingsPage = () => {
  const { profile, isLoading, error } = useUserProfile();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-8">
            {/* Botón hamburguesa — solo en móvil */}
            <MobileSidebarTrigger />

            {/* Encabezado */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona las preferencias de tu cuenta y personaliza la aplicación.
              </p>
            </div>

            {/* Contenido principal */}
            {isLoading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                Cargando perfil...
              </div>
            )}

            {error && !isLoading && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                No se pudo cargar el perfil. Recarga la página e inténtalo de nuevo.
              </div>
            )}

            {profile && !isLoading && (
              <div className="space-y-6">
                <PersonalInfoCard profile={profile} />
                <DangerZoneCard />
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SettingsPage;
