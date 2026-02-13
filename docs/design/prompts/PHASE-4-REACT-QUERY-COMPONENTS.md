# 🚀 Prompt para el Agente Frontend - Phase 4: Update Components (Día 2 - Tarde)

---

## 📋 Prerequisitos

✅ Phase 1: QueryClient setup  
✅ Phase 2: Queries migradas (useDatasets, useDataset)  
✅ Phase 3: Mutations migradas (useUpdateDataset, useDeleteDataset)

---

## 🎯 Objetivo de esta Fase

Actualizar los componentes existentes para usar los nuevos hooks de React Query y validar que todo funciona correctamente end-to-end.

**Componentes a actualizar:**
- `DatasetsList.tsx` - Lista principal
- `DatasetDashboard.tsx` - Dashboard individual (si existe)
- `DataUploadWizard.tsx` - Wizard de creación (si usa mutations)

---

## ✅ Task 4.1: Actualizar `DatasetsList.tsx`

### Paso 1: Analizar componente actual

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/DatasetsList.tsx`

**Interfaz ANTES (con hook legacy):**
```typescript
const { datasets, isLoading, error, refreshDatasets } = useDatasets();
```

**Interfaz DESPUÉS (con React Query):**
```typescript
const { data: datasets = [], isLoading, error, refetch } = useDatasets();
```

### Paso 2: Actualizar componente

**Modificaciones:**

```typescript
import { useDatasets } from "../hooks/useDatasets.js";
import { useDeleteDataset } from "../hooks/useDeleteDataset.js";

export const DatasetsList = () => {
  const navigate = useNavigate();
  
  // ✅ React Query hooks
  const { data: datasets = [], isLoading, error, refetch } = useDatasets();
  const deleteMutation = useDeleteDataset();

  /**
   * Eliminar dataset con confirmación
   */
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este dataset?')) {
      try {
        await deleteMutation.mutateAsync(id);
        // ✅ No necesitas llamar refetch, cache se invalida automáticamente
        toast.success('Dataset eliminado');
      } catch (err) {
        toast.error('Error al eliminar dataset');
      }
    }
  };

  /**
   * Navega al dashboard
   */
  const handleOpenDashboard = (id: string) => {
    navigate(`/datasets/${id}/dashboard`);
  };

  /**
   * Navega al wizard de creación
   */
  const handleCreateNew = () => {
    navigate('/datasets/new');
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          <div className="container max-w-5xl py-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Mis Datasets</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus datasets comparativos
                </p>
              </div>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Nuevo
              </Button>
            </div>

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">
                  Error al cargar datasets
                </p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error.message}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()} 
                  className="mt-3"
                >
                  Reintentar
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-lg border bg-muted/20 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Datasets List */}
            {!isLoading && !error && (
              <>
                {datasets.length === 0 ? (
                  <EmptyDatasets onCreateNew={handleCreateNew} />
                ) : (
                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <DatasetCard
                        key={dataset.id}
                        dataset={dataset}
                        onOpenDashboard={handleOpenDashboard}
                        onDelete={handleDelete}
                        isDeleting={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
```

### Paso 3: Actualizar `DatasetCard` (si es necesario)

Si `DatasetCard` necesita mostrar estado de loading durante delete:

```typescript
interface DatasetCardProps {
  dataset: Dataset;
  onOpenDashboard: (id: string) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export const DatasetCard = ({
  dataset,
  onOpenDashboard,
  onDelete,
  isDeleting,
}: DatasetCardProps) => {
  // ... resto del componente
  
  {onDelete && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onDelete(dataset.id)}
      disabled={isDeleting}
      className="text-destructive hover:text-destructive"
      aria-label="Delete dataset"
    >
      {isDeleting ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )}
};
```

---

## ✅ Task 4.2: Actualizar `DatasetDashboard.tsx` (si existe)

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/DatasetDashboard.tsx`

**Cambios:**

```typescript
import { useDataset } from '../hooks/useDataset.js';

export const DatasetDashboard = () => {
  const { id } = useParams<{ id: string }>();
  
  // ✅ React Query hook
  const { data: dataset, isLoading, error, refetch } = useDataset(id || null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error || !dataset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error al cargar dataset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'Dataset no encontrado'}
            </p>
            <Button onClick={() => refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Resto del componente con {dataset}
};
```

---

## ✅ Task 4.3: Limpiar código legacy

### Paso 1: Buscar hooks manuales restantes

```bash
# Buscar useState relacionado con datasets
grep -r "useState.*dataset" solution-sideby/apps/client/src/features/dataset

# Buscar useEffect de fetching
grep -r "useEffect.*fetch" solution-sideby/apps/client/src/features/dataset
```

### Paso 2: Eliminar archivos legacy

Si había versiones antiguas de hooks, eliminarlos:

```bash
# Ejemplo si había versiones old
rm solution-sideby/apps/client/src/features/dataset/hooks/useDatasets.old.ts
rm solution-sideby/apps/client/src/features/dataset/hooks/useDataset.old.ts
```

### Paso 3: Eliminar imports no usados

Verificar que no quedan imports de:
- `useState` innecesarios
- `useEffect` innecesarios
- `useCallback` para fetching

---

## ✅ Task 4.4: Actualizar tests de componentes

### Test de DatasetsList

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/__tests__/DatasetsList.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatasetsList } from '../DatasetsList';
import { createQueryClientWrapper } from '@/test/utils/react-query';
import * as api from '../../services/datasets.api';
import { MemoryRouter } from 'react-router-dom';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>,
    { wrapper: createQueryClientWrapper() }
  );
};

describe('DatasetsList (con React Query)', () => {
  it('debe renderizar datasets del backend', async () => {
    const mockDatasets = [
      { 
        id: '1', 
        meta: { name: 'Dataset A', createdAt: new Date(), updatedAt: new Date() },
        status: 'ready',
        ownerId: 'user123',
        sourceConfig: {
          groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 100 },
          groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 100 },
        },
        data: [],
      },
    ] as any[];
    
    vi.spyOn(api, 'listDatasets').mockResolvedValue(mockDatasets);
    
    renderWithRouter(<DatasetsList />);
    
    // Esperar a que cargue
    await waitFor(() => {
      expect(screen.getByText('Dataset A')).toBeInTheDocument();
    });
  });

  it('debe mostrar loading state', () => {
    vi.spyOn(api, 'listDatasets').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    renderWithRouter(<DatasetsList />);
    
    // Debe mostrar skeletons
    expect(screen.getAllByRole('presentation')).toHaveLength(3);
  });

  it('debe manejar error state', async () => {
    vi.spyOn(api, 'listDatasets').mockRejectedValue(new Error('Network error'));
    
    renderWithRouter(<DatasetsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar datasets')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('debe eliminar dataset con optimistic update', async () => {
    const mockDatasets = [
      { id: '1', meta: { name: 'Dataset 1' } },
      { id: '2', meta: { name: 'Dataset 2' } },
    ] as any[];
    
    vi.spyOn(api, 'listDatasets').mockResolvedValue(mockDatasets);
    vi.spyOn(api, 'deleteDataset').mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    renderWithRouter(<DatasetsList />);
    
    // Esperar a que cargue
    await waitFor(() => {
      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    });
    
    // Click en delete
    const deleteBtn = screen.getAllByLabelText('Delete dataset')[0];
    await userEvent.click(deleteBtn);
    
    // Dataset debe desaparecer (optimistic update)
    await waitFor(() => {
      expect(screen.queryByText('Dataset 1')).not.toBeInTheDocument();
    });
    
    expect(api.deleteDataset).toHaveBeenCalledWith('1');
  });
});
```

**Ejecutar tests:**
```bash
npm test -- DatasetsList.test.tsx
```

---

## ✅ Task 4.5: Validación End-to-End Manual

### Checklist de funcionalidades

```bash
# 1. Iniciar servers
cd solution-sideby/apps/api
npm run dev

cd solution-sideby/apps/client
npm run dev
```

**Flujo a probar:**

1. **Listar datasets:**
   - [ ] Abrir http://localhost:5173/datasets
   - [ ] Ver lista de datasets (o empty state)
   - [ ] Verificar en DevTools que query `['datasets']` está activa
   - [ ] Refresh página → datos aparecen instantáneamente (cache)

2. **Crear dataset:**
   - [ ] Click "Crear Nuevo"
   - [ ] Subir 2 archivos CSV
   - [ ] Completar wizard
   - [ ] Verificar que lista se actualiza automáticamente (invalidación)

3. **Ver dashboard:**
   - [ ] Click en botón "Dashboard" de un dataset
   - [ ] Dashboard carga datos correctamente
   - [ ] Verificar en DevTools query `['dataset', id]`
   - [ ] Volver a lista → lista sigue actualizada (cache)

4. **Eliminar dataset:**
   - [ ] Click en botón delete
   - [ ] Confirmar
   - [ ] Dataset desaparece instantáneamente (optimistic)
   - [ ] Si desconectas la red, hace rollback
   - [ ] Con red, se elimina permanentemente

5. **Error handling:**
   - [ ] Desconectar backend
   - [ ] Intentar cargar datasets → error message claro
   - [ ] Click "Reintentar"
   - [ ] Reconectar backend → debe funcionar

---

## 🎯 Checklist del Día 2 - Tarde

- [ ] `DatasetsList.tsx` actualizado con React Query hooks
- [ ] `DatasetDashboard.tsx` actualizado (si existe)
- [ ] Código legacy eliminado (useState/useEffect manuales)
- [ ] Tests de componentes actualizados y pasando
- [ ] Validación E2E manual completada (5 flujos)
- [ ] DevTools muestran queries/mutations correctamente
- [ ] Cache funciona (navegación instantánea)
- [ ] Optimistic updates funcionan (delete inmediato)
- [ ] Error states funcionan (retry manual)

---

## 📍 Estado Esperado al Finalizar

✅ **Migración a React Query COMPLETA**  
✅ **Todos los componentes actualizados**  
✅ **Tests pasando (unit + integration)**  
✅ **App funciona perfectamente end-to-end**  
✅ **Performance mejorada** (cache, menos requests)  
✅ **UX mejorada** (optimistic updates, feedback inmediato)

---

## 📊 Métricas de Éxito

### Antes vs Después

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas de código (hooks) | ~800 | ~500 | -37% |
| Loading en navegación repetida | 2-3s | <100ms | 95% |
| Requests duplicados | Común | Nunca | 100% |
| Feedback en delete | 1-2s | Instantáneo | 100% |
| Race conditions | Posibles | Imposibles | 100% |

---

## 🧪 Tests Finales

```bash
# Ejecutar toda la suite de tests
cd solution-sideby/apps/client
npm test

# Tests de hooks específicos
npm test -- features/dataset/hooks

# Tests de componentes específicos
npm test -- features/dataset/pages

# Coverage
npm run test:coverage
```

**Criterio de éxito:** 
- ✅ Todos los tests pasan
- ✅ Coverage > 80% en módulo datasets

---

## 🚨 Troubleshooting

### Problema: "Cannot read property 'data' of undefined"

**Causa:** Componente no está envuelto en QueryClientProvider

**Solución:** Verificar que App.tsx tiene el provider

---

### Problema: Cache no se invalida después de mutation

**Causa:** Query key no coincide

**Solución:** Verificar que usas exactamente el mismo queryKey:
```typescript
// Query
queryKey: ['datasets']

// Mutation invalidation
queryClient.invalidateQueries({ queryKey: ['datasets'] })
```

---

### Problema: Optimistic update no funciona

**Causa:** onMutate no devuelve context para rollback

**Solución:** Siempre devolver previousData en onMutate

---

## ✨ Siguiente Paso

**¡React Query Migration COMPLETADA! 🎉**

Ahora puedes comenzar con RFC-004:  
📄 **`docs/design/prompts/PHASE-5-DATASETS-LIST-UPDATE.md`**

---

## 📝 Commit Sugerido

```bash
git add .
git commit -m "feat(query): complete React Query migration

- Migrated all dataset hooks to TanStack Query v5
- Implemented optimistic updates for mutations
- Added cache invalidation strategy
- Updated all components to use new hooks
- All tests passing (unit + integration)

Performance improvements:
- 37% less boilerplate code
- 95% faster on repeated navigation (cache)
- Zero duplicate requests
- Instant UI feedback on mutations

BREAKING CHANGE: Removed legacy useState/useEffect hooks
"
```

---

**¡Excelente trabajo! Ahora tienes una base sólida con React Query para implementar RFC-004. 🚀**
