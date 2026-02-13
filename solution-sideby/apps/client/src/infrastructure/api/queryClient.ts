/**
 * TanStack Query Client Configuration
 *
 * Configuración centralizada para el manejo de server state.
 * Define políticas de cache, retry y revalidación para toda la app.
 *
 * Políticas configuradas:
 * - staleTime: Tiempo que los datos se consideran "frescos" antes de necesitar revalidación
 * - gcTime: Tiempo que los datos permanecen en cache después de quedar stale (antes cacheTime)
 * - retry: Número de intentos en caso de error
 * - refetchOnWindowFocus: Revalidar automáticamente al volver a la ventana
 * - refetchOnReconnect: Revalidar automáticamente al reconectar internet
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Cliente de React Query configurado con políticas optimizadas para SideBy
 *
 * Esta configuración balancea:
 * - Performance: Cache de 5 minutos reduce requests innecesarios
 * - Freshness: Revalidación al volver a la ventana mantiene datos actualizados
 * - UX: Retry limitado evita esperas innecesarias en errores permanentes
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" antes de revalidar (5 minutos)
      // Durante este tiempo, React Query devuelve datos del cache sin hacer request
      staleTime: 5 * 60 * 1000,

      // Tiempo de garbage collection: mantener datos en cache 10 minutos después de quedar stale
      // Esto permite navegación instantánea entre páginas dentro de este tiempo
      gcTime: 10 * 60 * 1000,

      // Reintentar 1 vez en caso de error de red o timeout
      // Evita múltiples intentos innecesarios en errores de autenticación (401, 403)
      retry: 1,

      // Revalidar automáticamente al volver a la ventana/tab del navegador
      // Asegura que los usuarios vean datos actualizados al regresar
      refetchOnWindowFocus: true,

      // NO revalidar al reconectar internet (evita requests excesivos)
      // El usuario puede refrescar manualmente si es necesario
      refetchOnReconnect: false,
    },
    mutations: {
      // NO reintentar mutations automáticamente
      // Las operaciones de escritura (POST, PUT, DELETE) no deben repetirse sin confirmación del usuario
      // Un retry automático podría crear duplicados o inconsistencias
      retry: 0,
    },
  },
});
