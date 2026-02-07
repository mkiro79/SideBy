/**
 * Toast Notification System
 *
 * Sistema centralizado de notificaciones usando Sonner.
 * Configurado con posición bottom-center y estilos adaptados a Tailwind 4.
 *
 * Variantes:
 * - success: Operaciones exitosas (verde)
 * - error: Errores (rojo)
 * - warning: Advertencias (amarillo) - info: Información (azul)
 * - loading: Operaciones en progreso (spinner)
 * - promise: Manejo automático de promesas async
 *
 * @example
 * ```tsx
 * import { toast } from '@/shared/services/toast';
 *
 * // Simple
 * toast.success('Dataset creado correctamente');
 * toast.error('Error al subir archivo');
 *
 * // Con promesa
 * toast.promise(uploadDataset(), {
 *   loading: 'Subiendo archivos...',
 *   success: 'Dataset creado exitosamente',
 *   error: 'Error al subir archivos'
 * });
 * ```
 */

import { toast as sonnerToast } from "sonner";

// Re-exportar todas las funciones de sonner
export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },

  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },

  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 3000,
    });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
