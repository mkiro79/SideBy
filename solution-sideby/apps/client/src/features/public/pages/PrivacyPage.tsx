/**
 * PrivacyPage - Política de Privacidad de SideBy
 *
 * Conforme al RGPD y legislación española.
 * Página pública, no requiere autenticación.
 */

import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button.js";
import { CONTACT_EMAIL } from "@/config/contact.js";

// ============================================================================
// COMPONENT
// ============================================================================

export const PrivacyPage = () => {
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última actualización: {new Date().getFullYear()}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Responsable del Tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales recogidos a través de
              <strong> SideBy</strong> es SideBy (en adelante, «nosotros» o «la plataforma»),
              con domicilio en España.
            </p>
            <p className="mt-2">
              Para cualquier consulta relacionada con el tratamiento de sus datos personales,
              puede contactarnos en:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Datos Recogidos</h2>
            <p>Recopilamos los siguientes datos personales:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Datos de registro:</strong> nombre, dirección de correo electrónico, y
                contraseña (almacenada de forma encriptada) o datos de autenticación mediante
                Google OAuth.
              </li>
              <li>
                <strong>Datos de uso:</strong> archivos CSV cargados, configuraciones de
                datasets y análisis generados dentro de la plataforma.
              </li>
              <li>
                <strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema
                operativo, identificadores de sesión y registros de acceso.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Finalidad del Tratamiento</h2>
            <p>Los datos personales son tratados con las siguientes finalidades:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Gestionar el alta, autenticación y mantenimiento de la cuenta de usuario.</li>
              <li>Prestar los servicios de análisis comparativo de datos.</li>
              <li>Mejorar las funcionalidades de la plataforma.</li>
              <li>Cumplir con las obligaciones legales aplicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Base Jurídica</h2>
            <p>
              El tratamiento de sus datos personales se basa en la ejecución del contrato de
              servicios (Art. 6.1.b RGPD) al que usted es parte como usuario registrado, así
              como en el cumplimiento de obligaciones legales (Art. 6.1.c RGPD) cuando así se
              requiera.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Conservación de los Datos</h2>
            <p>
              Los datos personales se conservarán durante el tiempo necesario para prestar el
              servicio y, una vez finalizada la relación, durante los plazos legalmente
              establecidos para atender posibles responsabilidades.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Destinatarios</h2>
            <p>
              No cedemos sus datos personales a terceros salvo obligación legal. Los datos
              podrán ser tratados por proveedores de servicios tecnológicos (hosting, cloud)
              bajo acuerdos de encargo de tratamiento conformes al RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Derechos del Usuario</h2>
            <p>
              En virtud del RGPD y la LOPDGDD, usted puede ejercer los siguientes derechos:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Acceso:</strong> obtener confirmación de si tratamos sus datos.</li>
              <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de sus datos personales.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento en determinadas circunstancias.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado.</li>
              <li>
                <strong>Limitación:</strong> solicitar la restricción del tratamiento en ciertos
                supuestos.
              </li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, contáctenos en{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              . También tiene derecho a presentar una reclamación ante la Agencia Española de
              Protección de Datos (
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                www.aepd.es
              </a>
              ).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
            <p>
              SideBy utiliza cookies técnicas estrictamente necesarias para el funcionamiento
              de la plataforma (gestión de sesión, autenticación). No utilizamos cookies de
              seguimiento ni publicidad de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política de privacidad periódicamente. Le notificaremos
              cualquier cambio significativo a través de la plataforma o por correo electrónico.
              El uso continuado del servicio tras la publicación de cambios implica la
              aceptación de la política actualizada.
            </p>
          </section>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} SideBy. Todos los derechos reservados.</span>
          <nav className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contacto</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
