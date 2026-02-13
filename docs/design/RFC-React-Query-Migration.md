# [RFC-React-Query] Migración a TanStack Query para Server State Management

| Metadatos | Detalles |
| :--- | :--- |
| **Fecha / Date** | 2026-02-13 |
| **Estado / Status** | **Aprobado para Implementación / Approved for Implementation** |
| **Prioridad / Priority** | Alta - Requerido antes de RFC-004 |
| **Esfuerzo / Effort** | 2 días |
| **Alcance / Scope** | `apps/client` (Frontend completo) |
| **Autor / Author** | Engineering Team |

---

## 1. Contexto y Motivación / Context & Motivation

### Problema Actual / Current Problem

El frontend maneja el **server state** (datos del backend) con hooks manuales basados en `useState` + `useEffect`. Esta implementación funciona pero tiene limitaciones críticas:

**❌ Problemas Identificados:**
1. **Sin cache:** Cada vez que se monta un componente, se hace fetch de nuevo
2. **Sin sincronización:** Si actualizas un dataset en una página, otras páginas no se refrescan
3. **Código boilerplate:** Cada hook repite ~15 líneas de loading/error/data
4. **Sin optimistic updates:** La UI se actualiza solo después de la respuesta del servidor
5. **Sin deduplicación:** Si 2 componentes piden el mismo dato, hace 2 requests paralelos
6. **Sin revalidación:** No hay estrategia de stale-while-revalidate

**📊 Impacto en RFC-004:**
El RFC-004 (Dataset Management UI) requiere:
- Dashboard con múltiples componentes compartiendo datos
- Sincronización entre DatasetsList → DatasetDetail → DatasetDashboard
- Filtros que actualizan múltiples visualizaciones
- Edición con feedback inmediato (optimistic updates)

**Implementar estos comportamientos manualmente agregaría ~300 líneas de código propenso a race conditions.**

### Solución Propuesta / Proposed Solution

Migrar a **TanStack Query v5** (React Query) para aprovechar:

✅ Cache inteligente por `queryKey`  
✅ Invalidación automática post-mutación  
✅ Estados simplificados (de 15 líneas → 5 líneas)  
✅ Optimistic updates out-of-the-box  
✅ Deduplicación de requests  
✅ Revalidación automática (stale-while-revalidate)  
✅ DevTools para debugging  

---

## 2. Arquitectura de Migración / Migration Architecture

### Convención de Query Keys

Adoptamos un sistema jerárquico de queryKeys para organizar el cache:

```typescript
// ✅ Formato estándar
['entity']              // Lista completa
['entity', id]          // Item individual
['entity', id, 'sub']   // Sub-recurso

// Ejemplos reales
['datasets']                        // GET /api/datasets
['dataset', '698f3809...']          // GET /api/datasets/:id
['dataset', '698f3809...', 'data']  // GET /api/datasets/:id/data (futuro)
```

**Beneficios:**
- Invalidación granular: `invalidateQueries({ queryKey: ['datasets'] })` invalida lista + detalles
- Prefetching: `prefetchQuery({ queryKey: ['dataset', nextId] })`
- Cache compartido: Múltiples componentes usan la misma query sin duplicar

### Estructura de Hooks (Naming Convention)

```typescript
// ✅ Queries (READ operations)
useDataset(id)           // Single entity
useDatasets()            // List/Collection
useDatasetData(id)       // Sub-resource

// ✅ Mutations (WRITE operations)
useCreateDataset()       // POST
useUpdateDataset()       // PATCH/PUT
useDeleteDataset()       // DELETE
useDatasetUpload()       // POST con FormData
useDatasetMapping()      // PATCH para configuración
```

---

## 3. Plan de Migración TDD (Step-by-Step)

### Phase 1: Setup Foundation (Día 1 - Mañana)

#### 1.1 Instalación de dependencias

```bash
npm install @tanstack/react-query@^5.0.0 @tanstack/react-query-devtools@^5.0.0
```

#### 1.2 Crear `queryClient` configuration

**Archivo:** `solution-sideby/apps/client/src/infrastructure/api/queryClient.ts`

```typescript
/**
 * TanStack Query Client Configuration
 * 
 * Configuración centralizada para el manejo de server state.
 * Define políticas de cache, retry y revalidación para toda la app.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente de React Query configurado con políticas de SideBy
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache válido por 5 minutos
      staleTime: 5 * 60 * 1000,
      
      // Guardar en cache por 10 minutos después de que quede stale
      gcTime: 10 * 60 * 1000,
      
      // Reintentar 1 vez en caso de error
      retry: 1,
      
      // Revalidar al volver a la ventana
      refetchOnWindowFocus: true,
      
      // No revalidar al reconectar (evita requests excesivos)
      refetchOnReconnect: false,
    },
    mutations: {
      // No reintentar mutations (operaciones write)
      retry: 0,
    },
  },
});
```

#### 1.3 Integrar en `App.tsx`

**TDD Step 1 - Test ANTES de implementar:**

```typescript
// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from '@/infrastructure/api/queryClient';

describe('App with QueryClient', () => {
  it('debe renderizar la app envuelta en QueryClientProvider', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    // Verificar que la app renderiza correctamente
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
  });
});
```

**Implementación:**

```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/infrastructure/api/queryClient';
import { AppRouter } from './routes';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      
      {/* DevTools solo en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

export default App;
```

---

### Phase 2: Migración de Queries (Día 1 - Tarde)

#### 2.1 Migrar `useDatasetsList`

**ANTES (Manual - useState/useEffect):**

```typescript
// features/dataset/hooks/useDatasets.ts (LEGACY)
export const useDatasets = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await datasetService.getDatasets();
      setDatasets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  return { datasets, isLoading, error, refresh: loadDatasets };
};
```

**TDD Step 2 - Test con React Query:**

```typescript
// features/dataset/hooks/__tests__/useDatasets.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDatasets } from '../useDatasets';
import * as api from '../../services/datasets.api';

// Helper para wrappear con QueryClient
const createWrapper = () => {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // No retry en tests
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDatasets (con React Query)', () => {
  it('debe cargar datasets correctamente', async () => {
    const mockDatasets = [
      { id: '1', name: 'Dataset A' },
      { id: '2', name: 'Dataset B' },
    ];
    
    vi.spyOn(api, 'listDatasets').mockResolvedValue(mockDatasets);
    
    const { result } = renderHook(() => useDatasets(), {
      wrapper: createWrapper(),
    });
    
    // Estado inicial: loading
    expect(result.current.isLoading).toBe(true);
    
    // Esperar a que cargue
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    // Datos cargados
    expect(result.current.data).toEqual(mockDatasets);
  });

  it('debe manejar errores correctamente', async () => {
    vi.spyOn(api, 'listDatasets').mockRejectedValue(
      new Error('Network error')
    );
    
    const { result } = renderHook(() => useDatasets(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    expect(result.current.error?.message).toBe('Network error');
  });
});
```

**DESPUÉS (Con React Query):**

```typescript
// features/dataset/hooks/useDatasets.ts (CON REACT QUERY)
import { useQuery } from '@tanstack/react-query';
import { listDatasets } from '../services/datasets.api';
import type { Dataset } from '../types/api.types';

/**
 * Hook para cargar la lista de datasets del usuario autenticado.
 * 
 * Utiliza React Query para cache automático, revalidación y sincronización.
 * 
 * @returns Query object con data, isLoading, error, refetch
 * 
 * @example
 * ```tsx
 * const { data: datasets, isLoading } = useDatasets();
 * 
 * if (isLoading) return <Spinner />;
 * return <DatasetGrid datasets={datasets} />;
 * ```
 */
export function useDatasets() {
  return useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
    staleTime: 2 * 60 * 1000, // 2 minutos (lista cambia frecuentemente)
  });
}
```

**📊 Comparación:**
- **Antes:** ~25 líneas con useState, useEffect, callbacks
- **Después:** ~8 líneas con cache automático
- **Reducción:** 68% menos código

#### 2.2 Migrar `useDataset` (detalle individual)

**TDD Step 3 - Test:**

```typescript
// features/dataset/hooks/__tests__/useDataset.test.ts
describe('useDataset', () => {
  it('debe cargar dataset por ID', async () => {
    const mockDataset = { id: '123', name: 'Test Dataset' };
    vi.spyOn(api, 'getDataset').mockResolvedValue(mockDataset);
    
    const { result } = renderHook(() => useDataset('123'), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockDataset);
  });

  it('NO debe hacer fetch si datasetId es null', () => {
    const spy = vi.spyOn(api, 'getDataset');
    
    renderHook(() => useDataset(null), {
      wrapper: createWrapper(),
    });
    
    // No debe llamar a la API
    expect(spy).not.toHaveBeenCalled();
  });
});
```

**Implementación:**

```typescript
// features/dataset/hooks/useDataset.ts
import { useQuery } from '@tanstack/react-query';
import { getDataset } from '../services/datasets.api';

/**
 * Hook para cargar un dataset individual por ID.
 * 
 * @param datasetId - ID del dataset o null para deshabilitar
 * @returns Query object con dataset completo
 */
export function useDataset(datasetId: string | null) {
  return useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => getDataset(datasetId!),
    enabled: !!datasetId, // Solo ejecutar si hay ID
    staleTime: 5 * 60 * 1000, // 5 minutos (detalle cambia menos)
  });
}
```

---

### Phase 3: Migración de Mutations (Día 2 - Mañana)

#### 3.1 Migrar `useDatasetUpload` (CREATE)

**TDD Step 4 - Test:**

```typescript
// features/dataset/hooks/__tests__/useDatasetUpload.test.ts
describe('useDatasetUpload', () => {
  it('debe subir archivos y crear dataset', async () => {
    const mockResponse = { datasetId: '123', status: 'processing' };
    vi.spyOn(api, 'uploadDataset').mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useDatasetUpload(), {
      wrapper: createWrapper(),
    });
    
    const files = [new File([''], 'test.csv')];
    
    act(() => {
      result.current.mutate({ fileA: files[0], fileB: files[1] });
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockResponse);
  });

  it('debe invalidar cache de datasets después de crear', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    
    // ... test de mutation
    
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ 
        queryKey: ['datasets'] 
      });
    });
  });
});
```

**Implementación:**

```typescript
// features/dataset/hooks/useDatasetUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDataset } from '../services/datasets.api';
import type { UploadPayload, UploadResponse } from '../types/api.types';

/**
 * Hook para subir archivos CSV y crear un nuevo dataset.
 * 
 * Invalida automáticamente el cache de la lista de datasets
 * después de un upload exitoso.
 * 
 * @returns Mutation object con mutate, isLoading, error
 * 
 * @example
 * ```tsx
 * const uploadMutation = useDatasetUpload();
 * 
 * const handleSubmit = async (files) => {
 *   const result = await uploadMutation.mutateAsync({
 *     fileA: files[0],
 *     fileB: files[1]
 *   });
 *   
 *   navigate(`/datasets/${result.datasetId}/mapping`);
 * };
 * ```
 */
export function useDatasetUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: UploadPayload) => uploadDataset(payload),
    
    onSuccess: () => {
      // ✅ Invalidar lista para que se refresque
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}
```

#### 3.2 Migrar `useDatasetMapping` (UPDATE)

**Implementación:**

```typescript
// features/dataset/hooks/useDatasetMapping.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDatasetMapping } from '../services/datasets.api';

/**
 * Hook para actualizar la configuración de mapping de un dataset.
 * 
 * Implementa optimistic updates para feedback inmediato.
 * 
 * @returns Mutation object con mutate, isLoading, error
 */
export function useDatasetMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      updateDatasetMapping(id, payload),
    
    // ⚡ Optimistic Update: Actualizar UI antes de la respuesta
    onMutate: async ({ id, payload }) => {
      // Cancelar queries en curso para evitar race condition
      await queryClient.cancelQueries({ queryKey: ['dataset', id] });
      
      // Snapshot del estado anterior (para rollback)
      const previousDataset = queryClient.getQueryData(['dataset', id]);
      
      // Actualizar cache optimísticamente
      queryClient.setQueryData(['dataset', id], (old: any) => ({
        ...old,
        schemaMapping: payload,
        status: 'ready',
      }));
      
      return { previousDataset };
    },
    
    // ❌ Rollback en caso de error
    onError: (err, { id }, context) => {
      queryClient.setQueryData(['dataset', id], context?.previousDataset);
    },
    
    // ✅ Revalidar después de éxito
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dataset', id] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}
```

#### 3.3 Crear `useDeleteDataset` (DELETE)

**Implementación:**

```typescript
// features/dataset/hooks/useDeleteDataset.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDataset } from '../services/datasets.api';

/**
 * Hook para eliminar un dataset.
 * 
 * Actualiza el cache optimísticamente removiendo el item
 * de la lista antes de la respuesta del servidor.
 * 
 * @returns Mutation object
 */
export function useDeleteDataset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (datasetId: string) => deleteDataset(datasetId),
    
    // ⚡ Optimistic Update: Remover de la lista inmediatamente
    onMutate: async (datasetId) => {
      await queryClient.cancelQueries({ queryKey: ['datasets'] });
      
      const previousDatasets = queryClient.getQueryData(['datasets']);
      
      // Remover del cache
      queryClient.setQueryData(['datasets'], (old: any[]) =>
        old.filter((dataset) => dataset.id !== datasetId)
      );
      
      return { previousDatasets };
    },
    
    // ❌ Rollback en caso de error
    onError: (err, datasetId, context) => {
      queryClient.setQueryData(['datasets'], context?.previousDatasets);
    },
    
    // ✅ Revalidar después de éxito
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}
```

---

### Phase 4: Actualizar Componentes (Día 2 - Tarde)

#### 4.1 Actualizar `DatasetsList.tsx`

**ANTES:**
```typescript
const { datasets, isLoading, error, deleteDataset } = useDatasets();
```

**DESPUÉS:**
```typescript
const { data: datasets = [], isLoading, error } = useDatasets();
const deleteMutation = useDeleteDataset();

const handleDelete = async (id: string) => {
  await deleteMutation.mutateAsync(id);
  // ✅ UI se actualiza automáticamente por optimistic update
};
```

#### 4.2 Actualizar `DatasetDashboard.tsx`

**ANTES:**
```typescript
const { dataset, isLoading, error, reload } = useDataset(id);
```

**DESPUÉS:**
```typescript
const { data: dataset, isLoading, error, refetch } = useDataset(id);

// ✅ refetch se puede usar para refresh manual
// ✅ Si otro componente modifica el dataset, este se actualiza automáticamente
```

---

## 4. Testing Strategy

### Test Utils para React Query

**Archivo:** `solution-sideby/apps/client/src/test/utils/react-query.tsx`

```typescript
/**
 * Test utilities para React Query
 * 
 * Proporciona helpers para wrappear componentes y hooks
 * con QueryClientProvider en tests.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

/**
 * Crea un QueryClient para tests con configuración apropiada
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No retry en tests
        gcTime: Infinity, // No garbage collection en tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Silenciar errores esperados en tests
    },
  });
}

/**
 * Wrapper para tests de componentes que usan React Query
 */
export function createQueryClientWrapper() {
  const testQueryClient = createTestQueryClient();
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 5. DevTools Configuration

### Configuración en `vite.config.ts`

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    // Habilitar DevTools solo en desarrollo
    __REACT_QUERY_DEVTOOLS__: process.env.NODE_ENV === 'development',
  },
});
```

### Uso en desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir http://localhost:5173
# Click en el icono de React Query en la esquina inferior derecha
# Ver queries activas, cache, timings, etc.
```

---

## 6. Beneficios Esperados

### UX (User Experience)
- ⚡ **Respuesta instantánea:** Cache hace que volver a páginas visitadas sea instantáneo
- ✅ **Sincronización automática:** Editar en una página actualiza todas las demás
- 🎯 **Feedback inmediato:** Optimistic updates muestran cambios antes de la respuesta del servidor
- 🔄 **Datos frescos:** Revalidación automática al volver a la pestaña

### DX (Developer Experience)
- 📉 **Menos código:** De ~25 líneas → ~8 líneas por hook (68% reducción)
- 🐛 **Debugging fácil:** DevTools muestra estado de todas las queries
- 🧪 **Tests simplificados:** Test utils centralizados
- 📚 **Documentación:** TanStack Query está muy bien documentado

### Performance
- 🚀 **Menos requests:** Deduplicación automática
- 📦 **Cache inteligente:** stale-while-revalidate strategy
- ⏱️ **Prefetching:** Cargar datos antes de que el usuario los necesite

---

## 7. Migration Checklist

### Setup (✅ Completar primero)
- [ ] Instalar `@tanstack/react-query` y devtools
- [ ] Crear `queryClient.ts` con configuración
- [ ] Wrappear `App.tsx` con `QueryClientProvider`
- [ ] Habilitar DevTools en desarrollo
- [ ] Crear test utils (`createTestQueryClient`)

### Queries Migration
- [ ] Migrar `useDatasets` → `useQuery`
- [ ] Migrar `useDataset` → `useQuery`
- [ ] Actualizar tests de hooks con wrapper

### Mutations Migration
- [ ] Migrar `useDatasetUpload` → `useMutation`
- [ ] Migrar `useDatasetMapping` → `useMutation`
- [ ] Crear `useDeleteDataset` → `useMutation`
- [ ] Implementar optimistic updates
- [ ] Implementar invalidación de cache

### Components Update
- [ ] Actualizar `DatasetsList.tsx`
- [ ] Actualizar `DataUploadWizard.tsx`
- [ ] Actualizar `DatasetDashboard.tsx`
- [ ] Actualizar tests de componentes

### Validation
- [ ] Ejecutar `npm run test` (toda suite pasa)
- [ ] Ejecutar `npm run test:integration`
- [ ] Verificar en DevTools que queries/mutations funcionan
- [ ] Testing manual de flujos CRUD completos

### Cleanup
- [ ] Remover código legacy (hooks manuales)
- [ ] Actualizar documentación del módulo
- [ ] Code review del equipo

---

## 8. Referencias

- **Docs Oficiales:** https://tanstack.com/query/latest/docs/react/overview
- **Migration Guide v5:** https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5
- **Best Practices:** https://tkdodo.eu/blog/practical-react-query (Blog de Dominik Dorfmeister, maintainer)
- **Query Keys:** https://tkdodo.eu/blog/effective-react-query-keys

---

## 9. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Curva de aprendizaje del equipo | Media | Workshop interno + docs con ejemplos reales del proyecto |
| Breaking changes en hook interface | Alta | Tests comprensivos antes de migrar |
| Cache stale issues | Media | Configurar `staleTime` apropiadamente por tipo de query |
| Bundle size increase (~15KB) | Baja | Aceptable dado los beneficios, y es tree-shakeable |

---

**Última Actualización:** 2026-02-13  
**Estado:** Aprobado - Implementar antes de RFC-004  
**Próximo RFC:** RFC-004-DASHBOARD-TEMPLATE (depende de esta migración)
