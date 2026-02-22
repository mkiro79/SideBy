/**
 * Configuración de contacto de SideBy.
 *
 * Centraliza el correo de contacto para facilitar cambios sin redeploy.
 * Se puede sobrescribir mediante la variable de entorno VITE_CONTACT_EMAIL.
 */

/** Correo de contacto principal de SideBy */
export const CONTACT_EMAIL: string =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ??
  "maribel.quiros.formacion@gmail.com";
