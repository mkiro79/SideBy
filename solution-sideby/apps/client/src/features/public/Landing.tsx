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
import { FileSpreadsheet, Columns, Bot, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store.js";
import { trackPageView, trackButtonClick } from "./services/mockServices.js";
import { useEffect } from "react";

// ============================================================================
// FEATURES DATA
// ============================================================================

const features = [
  {
    icon: FileSpreadsheet,
    title: "Upload CSV",
    description: "Import your datasets in seconds. Just drag and drop your CSV files to get started.",
  },
  {
    icon: Columns,
    title: "Map Columns",
    description: "Intuitive column mapping to align your data for accurate side-by-side comparison.",
  },
  {
    icon: Bot,
    title: "AI Insights",
    description: "Get intelligent analysis and actionable recommendations powered by AI.",
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
      navigate("/dashboard");
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">SideBy</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Start Free</Link>
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
                Compare anything,{" "}
                <span className="text-primary">SideBy</span> Side
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Upload your datasets, map your metrics, and let AI uncover the insights. 
                The fastest way to benchmark performance across periods, regions, or segments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="text-base px-8"
                  onClick={() => handleCTAClick("Hero - Get Started")}
                >
                  Get Started — It's Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-base"
                  onClick={() => handleCTAClick("Hero - See Demo")}
                >
                  See Demo
                </Button>
              </div>
            </div>

            {/* Hero Image - A/B Comparison Visualization */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                {/* Split gradient representing A/B comparison */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gradient-to-br from-blue-500/20 via-blue-500/40 to-blue-500/60" />
                  <div className="w-1/2 bg-gradient-to-bl from-indigo-500/20 via-indigo-500/40 to-indigo-500/60" />
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
                      <span className="text-xs text-muted-foreground">Current</span>
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
                      <span className="text-xs text-muted-foreground">Comparative</span>
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
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to unlock powerful insights from your data
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
                Ready to compare?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Start benchmarking your data in minutes. No credit card required.
              </p>
              <Button 
                size="lg" 
                className="text-base px-8"
                onClick={() => handleCTAClick("CTA - Start Free Today")}
              >
                Start Free Today
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
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <BarChart3 className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">SideBy</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SideBy. All rights reserved.
          </p>
          
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-foreground transition-colors" onClick={() => trackButtonClick("Footer - Privacy")}>
              Privacy
            </Link>
            <Link to="#" className="hover:text-foreground transition-colors" onClick={() => trackButtonClick("Footer - Terms")}>
              Terms
            </Link>
            <Link to="#" className="hover:text-foreground transition-colors" onClick={() => trackButtonClick("Footer - Contact")}>
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
