import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/AppSidebar";
import { MobileSidebarTrigger } from "@/shared/components/MobileSidebarTrigger.js";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { FileSpreadsheet, BarChart3, Bot } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store.js";
import { useNavigate } from "react-router-dom";
import { SideByWordmark } from "@/shared/components/SideByWordmark.js";

const features = [
  { icon: FileSpreadsheet, title: "Sube tus Datasets", description: "Importa archivos CSV con tus datos actuales", id: "upload-datasets" },
  { icon: BarChart3, title: "Compara Métricas", description: "Visualiza diferencias clave entre periodos", id: "compare-metrics" },
  { icon: Bot, title: "Insights con IA", description: "Obtén resúmenes automáticos", id: "ai-insights" },
];

const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userName = user?.name || user?.email?.split('@')[0] || "Usuario";

  const goToDatasetUpload = () => {
    navigate('/datasets/upload');
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
            {/* Botón hamburguesa — solo en móvil */}
            <MobileSidebarTrigger />
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">¡Hola, {userName}! 👋</h1>
                <p className="text-lg text-muted-foreground">Bienvenido a <SideByWordmark /></p>
              </div>
              <Badge variant="secondary">Freemium</Badge>
            </div>

            {/* Features Grid */}
            <section>
              <h2 className="text-xl font-semibold mb-4">¿Qué puedes crear?</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {features.map((feature) => (
                  <Card
                    key={feature.id}
                    className="group hover:border-primary/50 transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`Ir a crear nueva comparación: ${feature.title}`}
                    onClick={goToDatasetUpload}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        goToDatasetUpload();
                      }
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* CTA Final */}
            <section className="text-center py-6">
              <Button
                size="lg"
                className="gap-2"
                onClick={goToDatasetUpload}
              >
                <FileSpreadsheet className="h-5 w-5" />
                Crear Nueva Comparación
              </Button>
            </section>

          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Home;