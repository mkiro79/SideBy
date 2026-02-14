/**
 * Test utilities para React Query
 * 
 * Proporciona helpers para wrappear componentes y hooks con QueryClientProvider en tests.
 * 
 * Configuración de tests adaptada para:
 * - Deshabilitar retry automático (tests deben fallar rápido)
 * - Deshabilitar garbage collection (mantener datos durante todo el test)
 * - Mantener logging por defecto (útil para debugging de tests)
 * 
 * Uso:
 * ```tsx
 * // Para tests de hooks
 * const { result } = renderHook(() => useDatasets(), {
 *   wrapper: createQueryClientWrapper()
 * });
 * 
 * // Para tests de componentes
 * const queryClient = createTestQueryClient();
 * render(
 *   <QueryClientProvider client={queryClient}>
 *     <MyComponent />
 *   </QueryClientProvider>
 * );
 * ```
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Crea un QueryClient configurado específicamente para tests
 * 
 * Diferencias con el cliente de producción:
 * - retry: false - Los tests deben fallar inmediatamente, no reintentar
 * - gcTime: Infinity - Mantener datos en cache durante todo el test
 * 
 * @returns QueryClient configurado para entorno de testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // No reintentar queries en tests (fallar rápido)
        retry: false,
        
        // No hacer garbage collection durante los tests
        // Mantener todos los datos en cache hasta que termine el test
        gcTime: Infinity,
      },
      mutations: {
        // No reintentar mutations en tests
        retry: false,
      },
    },
  });
}

/**
 * Crea un wrapper de test que proporciona QueryClientProvider
 * 
 * Útil para tests de hooks con renderHook de @testing-library/react:
 * ```tsx
 * // Uso básico
 * const { result } = renderHook(() => useMyHook(), {
 *   wrapper: createQueryClientWrapper()
 * });
 * 
 * // Con pre-población de cache para optimistic updates
 * const { queryClient, Wrapper } = createQueryClientWrapper();
 * queryClient.setQueryData(['key'], initialData);
 * const { result } = renderHook(() => useMyHook(), { wrapper: Wrapper });
 * ```
 * 
 * @param options - Opcional: { queryClient } para reutilizar un cliente existente
 * @returns Componente wrapper con QueryClientProvider o objeto { queryClient, Wrapper }
 */
export function createQueryClientWrapper(options?: { queryClient?: QueryClient }) {
  const testQueryClient = options?.queryClient || createTestQueryClient();
  
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );

  // Retornar tanto el wrapper como el queryClient para tests avanzados
  return Object.assign(Wrapper, { queryClient: testQueryClient, Wrapper });
}
