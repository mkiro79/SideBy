/**
 * Landing Page - Página principal pública de SideBy
 * 
 * Funcionalidad:
 * - Hero section con visualización A/B
 * - Features grid explicativo
 * - CTA sections
 * - Header con navegación
 * - Footer con links informativos
 * 
 * Estilos adaptados a las variables CSS de Tailwind 4 definidas en index.css
 */
import { Button } from "@/shared/components/ui/button.js";
import { Card, CardContent } from "@/shared/components/ui/card.js";
import { FileSpreadsheet, Columns, Bot } from "lucide-react";
import { SideByLogo } from "@/shared/components/SideByLogo.js";
import { SideByWordmark } from "@/shared/components/SideByWordmark.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store.js";
import { trackPageView, trackButtonClick } from "../services/mockServices.js";
import { useEffect } from "react";

// ============================================================================
// FEATURES DATA
// ============================================================================

const features = [
  {
    icon: FileSpreadsheet,
    title: "Carga de datos",
    description: "Importa tus datasets en segundos. Arrastra y suelta tus archivos CSV para empezar.",
  },
  {
    icon: Columns,
    title: "Mapeo de columnas",
    description: "Alineación intuitiva de columnas para comparaciones precisas entre tus datasets.",
  },
  {
    icon: Bot,
    title: "IA Insights",
    description: "Obtén análisis inteligentes y recomendaciones accionables impulsadas por inteligencia artificial.",
  },
];

// ============================================================================
// LANDING PAGE COMPONENT
// ============================================================================

export const Landing = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Track page view cuando el componente se monta
  useEffect(() => {
    trackPageView("Landing");
  }, []);

  // Si está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const handleCTAClick = (buttonName: string) => {
    trackButtonClick(buttonName);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ========================================================================
          NAVBAR - Header fijo con navegación
      ======================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <SideByLogo size={32} />
            <SideByWordmark className="text-xl font-bold tracking-tight" />
          </Link>

          <nav className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Comenzar gratis</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ========================================================================
          HERO SECTION - Sección principal con texto y visualización
      ======================================================================== */}
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Hero Text */}
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Compara cualquier dato,{" "}
                <SideByWordmark />{" "}
                lado a lado
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Sube tus datasets, mapea tus métricas y deja que la IA descubra los insights.
                La forma más rápida de comparar rendimiento entre periodos, regiones o segmentos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="text-base px-8"
                  onClick={() => handleCTAClick("Hero - Comenzar gratis")}
                >
                  Comenzar — Es Gratis
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-base"
                  onClick={() => handleCTAClick("Hero - Ver demo")}
                >
                  Ver demo
                </Button>
              </div>
            </div>

            {/* Hero Image - A/B Comparison Visualization */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                {/* Split gradient representing A/B comparison */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gradient-to-br from-blue-500/20 via-blue-500/40 to-blue-500/60" />
                  <div className="w-1/2" style={{ background: 'linear-gradient(to bottom left, color-mix(in srgb, #f97415 20%, transparent), color-mix(in srgb, #f97415 40%, transparent), color-mix(in srgb, #f97415 60%, transparent))' }} />
                </div>
                
                {/* Overlay content */}
                <div className="relative z-10 h-full flex items-center justify-center p-8">
                  <div className="flex items-center gap-4">
                    {/* Dataset A */}
                    <div className="flex flex-col items-center p-4 bg-background/90 rounded-xl backdrop-blur-sm" style={{ boxShadow: 'var(--shadow-soft)' }}>
                      <div className="w-16 h-16 rounded-full bg-data-primary/20 flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-data-primary">A</span>
                      </div>
                      <span className="text-sm font-medium">Dataset A</span>
                      <span className="text-xs text-muted-foreground">Actual</span>
                    </div>
                    
                    {/* VS Separator */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-px bg-border" />
                      <span className="text-xs text-muted-foreground font-medium">VS</span>
                      <div className="w-8 h-px bg-border" />
                    </div>
                    
                    {/* Dataset B */}
                    <div className="flex flex-col items-center p-4 bg-background/90 rounded-xl backdrop-blur-sm" style={{ boxShadow: 'var(--shadow-soft)' }}>
                      <div className="w-16 h-16 rounded-full bg-data-comparative/20 flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-data-comparative">B</span>
                      </div>
                      <span className="text-sm font-medium">Dataset B</span>
                      <span className="text-xs text-muted-foreground">Comparativo</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative blur elements */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-data-primary/10 rounded-full blur-2xl" />
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-data-comparative/10 rounded-full blur-2xl" />
            </div>
          </div>
        </section>

        {/* ========================================================================
            FEATURES GRID - Cómo funciona SideBy (3 cards)
        ======================================================================== */}
        <section className="container mx-auto px-4 py-20 border-t border-border">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Cómo funciona
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tres pasos simples para obtener insights potentes de tus datos
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} variant="interactive" className="group">
                <CardContent className="p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-5 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold mb-4">
                    {features.indexOf(feature) + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ========================================================================
            CTA SECTION - Call to Action final
        ======================================================================== */}
        <section className="container mx-auto px-4 py-20">
          <div className="relative rounded-2xl bg-gradient-to-r from-data-primary/10 via-primary/5 to-data-comparative/10 p-12 text-center overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                ¿Listo para comparar?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Empieza a comparar tus datos en minutos. Sin tarjeta de crédito.
              </p>
              <Button 
                size="lg" 
                className="text-base px-8"
                onClick={() => handleCTAClick("CTA - Empezar gratis ahora")}
              >
                Empezar gratis ahora
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================
          FOOTER - Pie de página con links
      ======================================================================== */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SideByLogo size={20} />
            <SideByWordmark className="text-sm font-medium" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} <SideByWordmark />. Todos los derechos reservados.
          </p>
          
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors" onClick={() => trackButtonClick("Footer - Privacidad")}>
              Privacidad
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors" onClick={() => trackButtonClick("Footer - Términos")}>
              Términos
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors" onClick={() => trackButtonClick("Footer - Contacto")}>
              Contacto
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
