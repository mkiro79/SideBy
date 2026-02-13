# 🚀 Prompt para el Agente Frontend - Phase 3: React Query Mutations (Día 2 - Mañana)

---

## 📋 Prerequisitos

✅ Phase 1 completada: QueryClient setup funcionando  
✅ Phase 2 completada: useDatasets y useDataset migrados con tests

---

## 🎯 Objetivo de esta Fase

Migrar las operaciones de escritura (mutations) a React Query:
- `useUpdateDataset()` - Actualizar metadatos con optimistic updates
- `useDeleteDataset()` - Eliminar con cache removal optimista
- Actualizar `useDatasetUpload()` y `useDatasetMapping()` existentes

**Beneficios esperados:**
- Optimistic updates (UI responde instantáneamente)
- Invalidación automática de cache
- Rollback automático en errores
- Menos código boilerplate

---

## ✅ Task 3.1: Crear `useUpdateDataset` (UPDATE con optimistic)

### Paso 1: Definir API service

**Archivo:** `solution-sideby/apps/client/src/features/dataset/services/datasets.api.ts`

Agregar función de actualización:

```typescript
/**
 * Actualiza los metadatos de un dataset.
 * 
 * @param datasetId - ID del dataset
 * @param payload - Campos a actualizar (partial)
 * @returns Dataset actualizado
 */
export async function updateDataset(
  datasetId: string,
  payload: Partial<Dataset>
): Promise<Dataset> {
  const response = await apiClient.patch<Dataset>(
    `/api/datasets/${datasetId}`,
    payload
  );
  return response.data;
}
```

### Paso 2: Crear hook con optimistic updates

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useUpdateDataset.ts` (NUEVO)

```typescript
/**
 * useUpdateDataset Hook - Mutation para actualizar datasets
 * 
 * Implementa optimistic updates para feedback inmediato en la UI.
 * Invalida automáticamente el cache de la lista y del detalle.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDataset } from '../services/datasets.api';
import type { Dataset } from '../types/api.types';

interface UpdateDatasetParams {
  id: string;
  payload: Partial<Dataset>;
}

/**
 * Hook para actualizar metadatos de un dataset.
 * 
 * @returns Mutation object con mutate, isLoading, error
 * 
 * @example
 * ```tsx
 * const updateMutation = useUpdateDataset();
 * 
 * const handleSave = async (formData) => {
 *   await updateMutation.mutateAsync({
 *     id: datasetId,
 *     payload: {
 *       meta: { name: formData.name },
 *       sourceConfig: {
 *         groupA: { label: formData.labelA, color: formData.colorA },
 *       },
 *     },
 *   });
 *   
 *   toast.success('Dataset actualizado');
 * };
 * ```
 */
export function useUpdateDataset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: UpdateDatasetParams) =>
      updateDataset(id, payload),
    
    // ⚡ Optimistic Update: Actualizar UI inmediatamente
    onMutate: async ({ id, payload }) => {
      // Cancelar queries en curso para evitar race condition
      await queryClient.cancelQueries({ queryKey: ['dataset', id] });
      
      // Snapshot del estado anterior (para rollback)
      const previousDataset = queryClient.getQueryData(['dataset', id]);
      
      // Actualizar cache optimísticamente
      queryClient.setQueryData(['dataset', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...payload,
          meta: { ...old.meta, ...payload.meta },
          sourceConfig: {
            groupA: { ...old.sourceConfig?.groupA, ...payload.sourceConfig?.groupA },
            groupB: { ...old.sourceConfig?.groupB, ...payload.sourceConfig?.groupB },
          },
        };
      });
      
      return { previousDataset };
    },
    
    // ❌ Rollback en caso de error
    onError: (err, { id }, context) => {
      if (context?.previousDataset) {
        queryClient.setQueryData(['dataset', id], context.previousDataset);
      }
    },
    
    // ✅ Revalidar después de éxito
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dataset', id] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}
```

### Paso 3: Crear test del hook

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/__tests__/useUpdateDataset.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUpdateDataset } from '../useUpdateDataset';
import { createTestQueryClient } from '@/test/utils/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import * as api from '../../services/datasets.api';

const createWrapper = (queryClient: any) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUpdateDataset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe actualizar dataset y invalidar cache', async () => {
    const mockUpdatedDataset = {
      id: '123',
      meta: { name: 'Updated Name', createdAt: new Date(), updatedAt: new Date() },
      status: 'ready' as const,
      ownerId: 'user123',
      sourceConfig: {
        groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 100 },
        groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 100 },
      },
      data: [],
    };
    
    vi.spyOn(api, 'updateDataset').mockResolvedValue(mockUpdatedDataset);
    
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUpdateDataset(), {
      wrapper: createWrapper(queryClient),
    });
    
    act(() => {
      result.current.mutate({
        id: '123',
        payload: { meta: { name: 'Updated Name' } },
      });
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockUpdatedDataset);
    expect(api.updateDataset).toHaveBeenCalledWith('123', {
      meta: { name: 'Updated Name' },
    });
  });

  it('debe implementar optimistic update', async () => {
    const queryClient = createTestQueryClient();
    
    // Pre-poblar cache con dataset original
    const originalDataset = {
      id: '123',
      meta: { name: 'Original' },
      sourceConfig: {
        groupA: { label: 'A' },
        groupB: { label: 'B' },
      },
    };
    queryClient.setQueryData(['dataset', '123'], originalDataset);
    
    // Mock que tarda en responder
    vi.spyOn(api, 'updateDataset').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as any), 100))
    );
    
    const { result } = renderHook(() => useUpdateDataset(), {
      wrapper: createWrapper(queryClient),
    });
    
    act(() => {
      result.current.mutate({
        id: '123',
        payload: { meta: { name: 'Optimistic' } },
      });
    });
    
    // Cache debe actualizarse INMEDIATAMENTE (antes de la respuesta)
    const cachedData = queryClient.getQueryData(['dataset', '123']) as any;
    expect(cachedData.meta.name).toBe('Optimistic');
  });

  it('debe hacer rollback en caso de error', async () => {
    const queryClient = createTestQueryClient();
    
    const originalDataset = {
      id: '123',
      meta: { name: 'Original' },
    };
    queryClient.setQueryData(['dataset', '123'], originalDataset);
    
    vi.spyOn(api, 'updateDataset').mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useUpdateDataset(), {
      wrapper: createWrapper(queryClient),
    });
    
    act(() => {
      result.current.mutate({
        id: '123',
        payload: { meta: { name: 'Failed Update' } },
      });
    });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    // Cache debe volver al estado original
    const cachedData = queryClient.getQueryData(['dataset', '123']) as any;
    expect(cachedData.meta.name).toBe('Original');
  });
});
```

**Ejecutar test:**
```bash
npm test -- useUpdateDataset.test.ts
```

---

## ✅ Task 3.2: Crear `useDeleteDataset` (DELETE con optimistic removal)

### Paso 1: API service

**Archivo:** `solution-sideby/apps/client/src/features/dataset/services/datasets.api.ts`

```typescript
/**
 * Elimina un dataset permanentemente.
 * 
 * @param datasetId - ID del dataset
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  await apiClient.delete(`/api/datasets/${datasetId}`);
}
```

### Paso 2: Hook con optimistic removal

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useDeleteDataset.ts` (NUEVO)

```typescript
/**
 * useDeleteDataset Hook - Mutation para eliminar datasets
 * 
 * Actualiza el cache optimísticamente removiendo el item
 * de la lista antes de la respuesta del servidor.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDataset } from '../services/datasets.api';
import type { Dataset } from '../types/api.types';

/**
 * Hook para eliminar un dataset.
 * 
 * @returns Mutation object
 * 
 * @example
 * ```tsx
 * const deleteMutation = useDeleteDataset();
 * 
 * const handleDelete = async (id: string) => {
 *   if (confirm('¿Eliminar dataset?')) {
 *     await deleteMutation.mutateAsync(id);
 *     toast.success('Dataset eliminado');
 *   }
 * };
 * ```
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
      queryClient.setQueryData(['datasets'], (old: Dataset[] | undefined) => {
        if (!old) return old;
        return old.filter((dataset) => dataset.id !== datasetId);
      });
      
      return { previousDatasets };
    },
    
    // ❌ Rollback en caso de error
    onError: (err, datasetId, context) => {
      if (context?.previousDatasets) {
        queryClient.setQueryData(['datasets'], context.previousDatasets);
      }
    },
    
    // ✅ Revalidar después de éxito
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}
```

### Paso 3: Test del hook

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/__tests__/useDeleteDataset.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDeleteDataset } from '../useDeleteDataset';
import { createTestQueryClient } from '@/test/utils/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import * as api from '../../services/datasets.api';

const createWrapper = (queryClient: any) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDeleteDataset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe eliminar dataset y actualizar cache', async () => {
    vi.spyOn(api, 'deleteDataset').mockResolvedValue(undefined);
    
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDeleteDataset(), {
      wrapper: createWrapper(queryClient),
    });
    
    act(() => {
      result.current.mutate('123');
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(api.deleteDataset).toHaveBeenCalledWith('123');
  });

  it('debe remover del cache optimísticamente', async () => {
    const queryClient = createTestQueryClient();
    
    const mockDatasets = [
      { id: '1', meta: { name: 'Dataset 1' } },
      { id: '2', meta: { name: 'Dataset 2' } },
      { id: '3', meta: { name: 'Dataset 3' } },
    ];
    queryClient.setQueryData(['datasets'], mockDatasets);
    
    vi.spyOn(api, 'deleteDataset').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
    );
    
    const { result } = renderHook(() => useDeleteDataset(), {
      wrapper: createWrapper(queryClient),
    });
    
    act(() => {
      result.current.mutate('2');
    });
    
    // Cache debe actualizarse INMEDIATAMENTE
    const cachedData = queryClient.getQueryData(['datasets']) as any[];
    expect(cachedData).toHaveLength(2);
    expect(cachedData.find((d) => d.id === '2')).toBeUndefined();
  });

  it('debe hacer rollback si falla', async () => {
    const queryClient = createTestQueryClient();
    
    const mockDatasets = [
      { id: '1', meta: { name: 'Dataset 1' } },
      { id: '2', meta: { name: 'Dataset 2' } },
    ];
    queryClient.setQueryData(['datasets'], mockDatasets);
    
    vi.spyOn(api, 'deleteDataset').mockRejectedValue(new Error('Forbidden'));
    
    const { result } = renderHook(() => useDeleteDataset(), {
      wrapper: createWrapper(queryClient),
    });
    
    act(() => {
      result.current.mutate('2');
    });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    // Cache debe volver al estado original
    const cachedData = queryClient.getQueryData(['datasets']) as any[];
    expect(cachedData).toHaveLength(2);
    expect(cachedData.find((d) => d.id === '2')).toBeDefined();
  });
});
```

**Ejecutar test:**
```bash
npm test -- useDeleteDataset.test.ts
```

---

## ✅ Task 3.3: Actualizar mutations existentes

Si ya existen `useDatasetUpload` y `useDatasetMapping`, actualizarlos para usar React Query y agregar invalidación de cache.

### Actualizar `useDatasetUpload`

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useDatasetUpload.ts`

Asegurar que tiene invalidación:

```typescript
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

### Actualizar `useDatasetMapping`

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useDatasetMapping.ts`

```typescript
export function useDatasetMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      updateDatasetMapping(id, payload),
    
    onSuccess: (_, { id }) => {
      // ✅ Invalidar detalle y lista
      queryClient.invalidateQueries({ queryKey: ['dataset', id] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}
```

---

## ✅ Task 3.4: Actualizar exports

**Archivo:** `solution-sideby/apps/client/src/features/dataset/index.ts`

```typescript
// Queries
export { useDatasets } from "./hooks/useDatasets.js";
export { useDataset } from "./hooks/useDataset.js";

// Mutations
export { useDatasetUpload } from "./hooks/useDatasetUpload.js";
export { useDatasetMapping } from "./hooks/useDatasetMapping.js";
export { useUpdateDataset } from "./hooks/useUpdateDataset.js";
export { useDeleteDataset } from "./hooks/useDeleteDataset.js";

// Services
export * from "./services/datasets.api.js";

// Types
export type * from "./types/api.types.js";
```

---

## 🎯 Checklist del Día 2 - Mañana

- [ ] API services completos (`updateDataset`, `deleteDataset`)
- [ ] `useUpdateDataset` implementado con optimistic updates
- [ ] Tests de `useUpdateDataset` pasan (3 tests: update, optimistic, rollback)
- [ ] `useDeleteDataset` implementado con optimistic removal
- [ ] Tests de `useDeleteDataset` pasan (3 tests: delete, optimistic, rollback)
- [ ] `useDatasetUpload` actualizado con invalidación
- [ ] `useDatasetMapping` actualizado con invalidación
- [ ] Exports actualizados
- [ ] Todos los tests pasan: `npm test -- features/dataset/hooks`

---

## 📍 Estado Esperado al Finalizar

✅ **Todas las mutations migradas a React Query**  
✅ **Optimistic updates funcionando** (UI responde instantáneamente)  
✅ **Rollback automático** en errores  
✅ **Invalidación de cache** automática después de mutations  
✅ **Tests comprehensivos** pasando

---

## 🧪 Validación Manual

1. Abrir DevTools de React Query
2. Crear/editar/eliminar un dataset
3. Verificar que mutations aparecen en DevTools
4. Verificar que queries se invalidan automáticamente (status: "fetching")
5. Verificar que UI se actualiza antes de la respuesta (optimistic)
6. Desconectar red y hacer mutation → debe hacer rollback

---

## 🚨 Notas Importantes

1. **Optimistic updates solo para UX crítica** - No todas las mutations lo necesitan
2. **Rollback context** - Siempre devolver context en onMutate para rollback
3. **cancelQueries** - Importante para evitar race conditions
4. **invalidateQueries** - Usar después de TODA mutation que afecte data

---

## ✨ Siguiente Paso

Una vez completado, reporta **"Phase 3 completada"** y continúa con:  
📄 **`docs/design/prompts/PHASE-4-REACT-QUERY-COMPONENTS.md`**

---

**¡Éxito con las mutations! 🚀**
