/**
 * TermsPage - Términos y Condiciones de Uso de SideBy
 *
 * Condiciones estándar SaaS con legislación española aplicable.
 * Página pública, no requiere autenticación.
 */

import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button.js";

// ============================================================================
// COMPONENT
// ============================================================================

export const TermsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">SideBy</span>
          </Link>
          <Button variant="outline" asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 container mx-auto max-w-3xl px-4 pt-28 pb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última actualización: {new Date().getFullYear()}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Objeto del Servicio</h2>
            <p>
              SideBy es una plataforma web que permite a los usuarios cargar, comparar y
              analizar datasets CSV mediante visualizaciones comparativas e inteligencia
              artificial. El acceso al servicio se realiza mediante registro de cuenta de
              usuario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Aceptación de los Términos</h2>
            <p>
              El uso de SideBy implica la aceptación plena y sin reservas de los presentes
              términos y condiciones. Si no está de acuerdo con alguno de ellos, le rogamos
              que no utilice el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Licencia de Uso</h2>
            <p>
              SideBy concede al usuario una licencia de uso personal, intransferible, no
              exclusiva y revocable para acceder a las funcionalidades de la plataforma, sujeta
              al cumplimiento de estos términos. Queda expresamente prohibido:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Reproducir, copiar, distribuir o explotar comercialmente el servicio sin autorización.</li>
              <li>Realizar ingeniería inversa o intentar acceder al código fuente de la plataforma.</li>
              <li>Utilizar el servicio para actividades ilegales, fraudulentas o que vulneren derechos de terceros.</li>
              <li>Cargar datos que infrinjan derechos de propiedad intelectual de terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Cuenta de Usuario</h2>
            <p>
              El usuario es responsable de mantener la confidencialidad de sus credenciales de
              acceso. Cualquier actividad realizada bajo su cuenta es de su exclusiva
              responsabilidad. SideBy se reserva el derecho a suspender o cancelar cuentas que
              incumplan los presentes términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Propiedad de los Datos</h2>
            <p>
              El usuario conserva en todo momento la propiedad de los datos que suba a la
              plataforma. SideBy no reclama propiedad alguna sobre dichos datos. Al cargar
              datos en SideBy, el usuario garantiza que tiene los derechos necesarios para
              hacerlo y que su uso no infringe derechos de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Propiedad Intelectual</h2>
            <p>
              Todos los elementos que componen la plataforma SideBy (diseño, código, marcas,
              logotipos, algoritmos) son propiedad de SideBy o de sus licenciantes y están
              protegidos por la legislación española e internacional en materia de propiedad
              intelectual e industrial. Queda prohibida su reproducción sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Disponibilidad del Servicio</h2>
            <p>
              SideBy procurará mantener el servicio disponible de forma continua, pero no
              garantiza una disponibilidad del 100 %. El servicio podrá interrumpirse
              temporalmente por mantenimiento, actualizaciones o causas de fuerza mayor.
              SideBy no será responsable de los daños que pudieran derivarse de dichas
              interrupciones.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitación de Responsabilidad</h2>
            <p>
              En la máxima medida permitida por la ley, SideBy no será responsable de daños
              indirectos, incidentales, especiales o consecuentes derivados del uso o la
              imposibilidad de uso del servicio, incluyendo pero no limitado a la pérdida de
              datos o de beneficios. La responsabilidad total de SideBy frente al usuario no
              excederá en ningún caso el importe abonado por el usuario en los últimos doce
              meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Modificación de los Términos</h2>
            <p>
              SideBy se reserva el derecho de modificar los presentes términos en cualquier
              momento. Las modificaciones serán comunicadas a los usuarios mediante la
              plataforma o por correo electrónico con un preaviso razonable. El uso continuado
              del servicio tras la notificación implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Ley Aplicable y Jurisdicción</h2>
            <p>
              Los presentes términos se rigen por la legislación española. Para la resolución
              de cualquier conflicto derivado del uso del servicio, las partes se someten a la
              jurisdicción de los Juzgados y Tribunales de España, con renuncia expresa a
              cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos, puede contactarnos en:{" "}
              <a
                href="mailto:maribel.quiros.formacion@gmail.com"
                className="text-primary underline underline-offset-4"
              >
                maribel.quiros.formacion@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} SideBy. Todos los derechos reservados.</span>
          <nav className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contacto</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
