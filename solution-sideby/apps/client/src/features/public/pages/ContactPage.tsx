/**
 * ContactPage - Página de contacto de SideBy
 *
 * Formulario con react-hook-form + zod y envío mediante EmailJS.
 * Página pública, no requiere autenticación.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import emailjs from "@emailjs/browser";
import { BarChart3, Mail, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button.js";
import { toast } from "@/shared/services/toast.js";

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const contactSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres."),
  email: z.string().email("Introduce un correo electrónico válido."),
  asunto: z
    .string()
    .min(3, "El asunto debe tener al menos 3 caracteres.")
    .max(120, "El asunto no puede superar los 120 caracteres."),
  mensaje: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(2000, "El mensaje no puede superar los 2000 caracteres."),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  /**
   * Envía el formulario mediante EmailJS.
   * Las variables de entorno se configuran en .env.local:
   *   VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
   */
  const onSubmit = async (data: ContactFormData) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

    if (!serviceId || !templateId || !publicKey) {
      toast.error(
        "Configuración incompleta",
        "El formulario de contacto no está configurado. Por favor, inténtelo más tarde."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: data.nombre,
          from_email: data.email,
          subject: data.asunto,
          message: data.mensaje,
          to_email: "maribel.quiros.formacion@gmail.com",
        },
        publicKey
      );

      toast.success(
        "Mensaje enviado",
        "Gracias por contactarnos. Te responderemos a la mayor brevedad posible."
      );
      reset();
      setSent(true);
    } catch {
      toast.error(
        "Error al enviar",
        "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo o escríbenos directamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <main className="flex-1 container mx-auto max-w-4xl px-4 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Contacto</h1>
          <p className="text-muted-foreground">
            ¿Tienes alguna pregunta o sugerencia? Escríbenos y te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Panel de información */}
          <aside className="space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-1">SideBy</h2>
              <p className="text-sm text-muted-foreground">
                Plataforma de análisis comparativo de datos.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Correo electrónico</p>
                <a
                  href="mailto:maribel.quiros.formacion@gmail.com"
                  className="text-sm text-primary underline underline-offset-4 break-all"
                >
                  maribel.quiros.formacion@gmail.com
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p>Tiempo de respuesta habitual:</p>
              <p className="font-medium text-foreground mt-1">24 – 48 horas hábiles</p>
            </div>
          </aside>

          {/* Formulario */}
          <div className="md:col-span-2">
            {sent ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 p-12 text-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Send className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">¡Mensaje enviado!</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Gracias por contactarnos. Te responderemos a la mayor brevedad posible.
                </p>
                <Button variant="outline" onClick={() => setSent(false)}>
                  Enviar otro mensaje
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label htmlFor="nombre" className="text-sm font-medium">
                    Nombre <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    autoComplete="name"
                    placeholder="Tu nombre"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    {...register("nombre")}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-destructive">{errors.nombre.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Correo electrónico <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Asunto */}
                <div className="space-y-1.5">
                  <label htmlFor="asunto" className="text-sm font-medium">
                    Asunto <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <input
                    id="asunto"
                    type="text"
                    placeholder="¿Sobre qué quieres contactarnos?"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    {...register("asunto")}
                  />
                  {errors.asunto && (
                    <p className="text-xs text-destructive">{errors.asunto.message}</p>
                  )}
                </div>

                {/* Mensaje */}
                <div className="space-y-1.5">
                  <label htmlFor="mensaje" className="text-sm font-medium">
                    Mensaje <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="mensaje"
                    rows={6}
                    placeholder="Escribe tu mensaje aquí..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 resize-none"
                    {...register("mensaje")}
                  />
                  {errors.mensaje && (
                    <p className="text-xs text-destructive">{errors.mensaje.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar mensaje
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} SideBy. Todos los derechos reservados.</span>
          <nav className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
