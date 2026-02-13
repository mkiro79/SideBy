# 🚀 Prompt para el Agente Frontend - Phase 2: React Query Queries (Día 1 - Tarde)

---

## 📋 Prerequisitos

✅ Phase 1 completada: QueryClient setup, DevTools funcionando, test utils creados

---

## 🎯 Objetivo de esta Fase

Migrar los hooks de lectura (queries) existentes a React Query:
- `useDatasets()` - Lista de datasets del usuario
- `useDataset(id)` - Dataset individual por ID

**Beneficios esperados:**
- Cache automático (reduce requests al backend)
- Deduplicación de queries
- Revalidación automática
- Código más limpio (de ~25 líneas a ~8 líneas por hook)

---

## ✅ Task 2.1: Migrar `useDatasets` (Lista)

### Paso 1: Analizar hook actual

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useDatasets.ts`

**Código ACTUAL (manual):**
```typescript
// ~136 líneas con useState, useEffect, callbacks
export const useDatasets = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadDatasets = useCallback(async () => {
    try {
      setIsLoading(true);
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
  
  return { datasets, isLoading, error, refreshDatasets: loadDatasets };
};
```

### Paso 2: Crear API service (si no existe)

**Archivo:** `solution-sideby/apps/client/src/features/dataset/services/datasets.api.ts`

```typescript
/**
 * Dataset API Client
 * 
 * Cliente HTTP para interactuar con el backend de datasets.
 * Usa apiClient configurado con interceptors de autenticación.
 */

import { apiClient } from '@/infrastructure/api/client';
import type { Dataset } from '../types/api.types';

/**
 * Obtiene la lista de datasets del usuario autenticado.
 * 
 * @returns Lista de datasets
 * @throws {Error} Si falla la autenticación o el request
 */
export async function listDatasets(): Promise<Dataset[]> {
  const response = await apiClient.get<Dataset[]>('/api/datasets');
  return response.data;
}

/**
 * Obtiene un dataset individual por ID.
 * 
 * @param datasetId - ID del dataset
 * @returns Dataset completo con datos
 */
export async function getDataset(datasetId: string): Promise<Dataset> {
  const response = await apiClient.get<Dataset>(`/api/datasets/${datasetId}`);
  return response.data;
}
```

### Paso 3: Crear hook CON React Query

**NUEVO `useDatasets.ts`:**

```typescript
/**
 * useDatasets Hook - Query para lista de datasets
 * 
 * Migrado a React Query para cache automático y sincronización.
 * Reemplaza implementación manual con useState/useEffect.
 */

import { useQuery } from '@tanstack/react-query';
import { listDatasets } from '../services/datasets.api';

/**
 * Hook para cargar la lista de datasets del usuario autenticado.
 * 
 * Utiliza React Query para cache automático, revalidación y sincronización.
 * 
 * @returns Query object con data, isLoading, error, refetch
 * 
 * @example
 * ```tsx
 * const { data: datasets = [], isLoading, error } = useDatasets();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error.message} />;
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

### Paso 4: Crear test del hook

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/__tests__/useDatasets.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDatasets } from '../useDatasets';
import { createQueryClientWrapper } from '@/test/utils/react-query';
import * as api from '../../services/datasets.api';

describe('useDatasets (con React Query)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe cargar datasets del backend correctamente', async () => {
    const mockDatasets = [
      {
        id: '698f3809e7a4974e30e129c6',
        meta: { name: 'Dataset A', createdAt: new Date(), updatedAt: new Date() },
        status: 'ready',
        ownerId: 'user123',
        sourceConfig: {
          groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 100 },
          groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 100 },
        },
        data: [],
      },
      {
        id: '698f3809e7a4974e30e129c7',
        meta: { name: 'Dataset B', createdAt: new Date(), updatedAt: new Date() },
        status: 'processing',
        ownerId: 'user123',
        sourceConfig: {
          groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 100 },
          groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 100 },
        },
        data: [],
      },
    ];
    
    vi.spyOn(api, 'listDatasets').mockResolvedValue(mockDatasets);
    
    const { result } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });
    
    // Estado inicial: loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    
    // Esperar a que cargue
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    // Datos cargados
    expect(result.current.data).toEqual(mockDatasets);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar errores correctamente', async () => {
    const errorMessage = 'Network error';
    vi.spyOn(api, 'listDatasets').mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.data).toBeUndefined();
  });

  it('debe cachear resultados (no hacer fetch duplicado)', async () => {
    const mockDatasets = [{ id: '1', meta: { name: 'Test' } }];
    const spy = vi.spyOn(api, 'listDatasets').mockResolvedValue(mockDatasets as any);
    
    const { result: result1 } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });
    
    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });
    
    // Renderizar otro hook con la misma query
    const { result: result2 } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });
    
    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });
    
    // Debe haber llamado solo UNA vez (cache)
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

**Ejecutar test:**
```bash
npm test -- useDatasets.test.ts
```

**Criterio de éxito:** Todos los tests pasan

---

## ✅ Task 2.2: Migrar `useDataset` (Detalle individual)

### Paso 1: Analizar hook actual

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useDataset.ts`

**Código ACTUAL:**
```typescript
export function useDataset(datasetId: string | null) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const load = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await getDataset(id);
      setDataset(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (datasetId) load(datasetId);
  }, [datasetId, load]);
  
  return { dataset, isLoading, error, reload };
}
```

### Paso 2: Crear hook CON React Query

**NUEVO `useDataset.ts`:**

```typescript
/**
 * useDataset Hook - Query para dataset individual
 * 
 * Migrado a React Query para cache automático y sincronización.
 */

import { useQuery } from '@tanstack/react-query';
import { getDataset } from '../services/datasets.api';

/**
 * Hook para cargar un dataset individual por ID.
 * 
 * @param datasetId - ID del dataset o null para deshabilitar
 * @returns Query object con dataset completo
 * 
 * @example
 * ```tsx
 * const { data: dataset, isLoading, error } = useDataset(id);
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage />;
 * if (!dataset) return null;
 * 
 * return <DashboardView dataset={dataset} />;
 * ```
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

### Paso 3: Crear test del hook

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/__tests__/useDataset.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDataset } from '../useDataset';
import { createQueryClientWrapper } from '@/test/utils/react-query';
import * as api from '../../services/datasets.api';

describe('useDataset (con React Query)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe cargar dataset por ID correctamente', async () => {
    const mockDataset = {
      id: '123',
      meta: { name: 'Test Dataset', createdAt: new Date(), updatedAt: new Date() },
      status: 'ready' as const,
      ownerId: 'user123',
      sourceConfig: {
        groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 100 },
        groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 100 },
      },
      data: [],
    };
    
    vi.spyOn(api, 'getDataset').mockResolvedValue(mockDataset);
    
    const { result } = renderHook(() => useDataset('123'), {
      wrapper: createQueryClientWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockDataset);
    expect(api.getDataset).toHaveBeenCalledWith('123');
  });

  it('NO debe hacer fetch si datasetId es null', () => {
    const spy = vi.spyOn(api, 'getDataset');
    
    const { result } = renderHook(() => useDataset(null), {
      wrapper: createQueryClientWrapper(),
    });
    
    // Query está deshabilitada
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    
    // No debe llamar a la API
    expect(spy).not.toHaveBeenCalled();
  });

  it('debe manejar errores correctamente', async () => {
    vi.spyOn(api, 'getDataset').mockRejectedValue(new Error('Dataset not found'));
    
    const { result } = renderHook(() => useDataset('999'), {
      wrapper: createQueryClientWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    expect(result.current.error?.message).toBe('Dataset not found');
  });
});
```

**Ejecutar test:**
```bash
npm test -- useDataset.test.ts
```

**Criterio de éxito:** Todos los tests pasan

---

## ✅ Task 2.3: Actualizar exports del módulo

**Archivo:** `solution-sideby/apps/client/src/features/dataset/index.ts`

Asegurarse de que exporta los hooks migrados:

```typescript
// Hooks (React Query)
export { useDatasets } from "./hooks/useDatasets.js";
export { useDataset } from "./hooks/useDataset.js";

// Services
export * from "./services/datasets.api.js";

// Types
export type * from "./types/api.types.js";
```

---

## 🎯 Checklist del Día 1 - Tarde

- [ ] API service `datasets.api.ts` creado con `listDatasets` y `getDataset`
- [ ] `useDatasets` migrado a React Query (de ~136 líneas a ~15 líneas)
- [ ] Tests de `useDatasets` pasan correctamente
- [ ] `useDataset` migrado a React Query
- [ ] Tests de `useDataset` pasan correctamente
- [ ] Exports actualizados en `index.ts`
- [ ] No hay errores de TypeScript
- [ ] Todos los tests del módulo pasan: `npm test -- features/dataset/hooks`

---

## 📍 Estado Esperado al Finalizar

✅ **Hooks de queries migrados a React Query**  
✅ **Tests actualizados y pasando**  
✅ **Cache automático funcionando** (verificar en DevTools)  
✅ **App sigue funcionando** (aún no actualizamos componentes, eso es mañana)

---

## 🧪 Validación Manual

1. Abrir DevTools de React Query
2. Navegar a `/datasets` (si existe la ruta)
3. Verificar que aparece query `['datasets']` en DevTools
4. Verificar que tiene status "success" y muestra datos
5. Hacer refresh de la página → debe mostrar datos desde cache (instantáneo)

---

## 🚨 Notas Importantes

1. **NO actualices componentes todavía** - mantén la interfaz del hook compatible
2. Los hooks devuelven `data` en lugar de `datasets`/`dataset`, pero componentes esperan el nombre viejo
3. **Backward compatibility:** Puedes destructurar con alias: `const { data: datasets } = useDatasets()`
4. **queryKey convention:** `['entity']` para listas, `['entity', id]` para detalles

---

## ❓ Si Encuentras Problemas

**Problema:** "Cannot find module '@/test/utils/react-query'"  
**Solución:** Verifica que creaste el archivo en Phase 1

**Problema:** Tests fallan con "wrapper is not a function"  
**Solución:** Asegúrate de usar `wrapper: createQueryClientWrapper()` en renderHook

**Problema:** "apiClient is not defined"  
**Solución:** Verifica que existe `src/infrastructure/api/client.ts` con axios configurado

---

## ✨ Siguiente Paso

Una vez completado, reporta **"Phase 2 completada"** y continúa con:  
📄 **`docs/design/prompts/PHASE-3-REACT-QUERY-MUTATIONS.md`**

---

**¡Éxito con la migración de queries! 🚀**
