/**
 * Toaster Component
 * 
 * Proveedor del sistema de notificaciones Sonner.
 * Debe ser montado una sola vez en el root de la aplicación (App.tsx).
 * 
 * Configuración:
 * - Posición: bottom-center
 * - Tema: adapta automáticamente a light/dark mode
 * - Estilos personalizados con variables CSS de Tailwind 4
 */

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg border border-border bg-background text-foreground shadow-[var(--shadow-elevated)]',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error: 'border-destructive/50 bg-destructive/10 text-destructive',
          success: 'border-data-success/50 bg-data-success/10 text-data-success',
          warning: 'border-data-warning/50 bg-data-warning/10 text-data-warning',
          info: 'border-data-primary/50 bg-data-primary/10 text-data-primary',
        },
      }}
      closeButton
      richColors
    />
  );
}
