# 🚀 Prompt para el Agente Frontend - Phase 5: DatasetsList Update (RFC-004 - Día 3)

---

## 📋 Prerequisitos

✅ React Query migration COMPLETA (Phase 1-4)  
✅ Backend endpoints funcionando (`GET /api/datasets`, `GET /api/datasets/:id`)  
✅ Feature flags configurados en `src/config/features.ts`  
✅ JWT authentication activa

---

## 🎯 Objetivo de esta Fase

Actualizar `DatasetsList` para:
1. Conectar con API real (eliminar datos mock si existen)
2. Agregar botón "Edit" (hidden behind feature flag)
3. Agregar botón "Dashboard" (siempre visible)
4. Implementar navegación a rutas `/datasets/:id` y `/datasets/:id/dashboard`

**Tiempo estimado:** 3-4 horas

---

## ✅ Task 5.1: Configurar Feature Flags

### Verificar archivo de configuración

**Archivo:** `solution-sideby/apps/client/src/config/features.ts`

```typescript
/**
 * Feature flags para el módulo de datasets
 */
interface DatasetFeatureFlags {
  /** Habilita el botón de edición en DatasetsList y DatasetCard */
  DATASET_EDIT_ENABLED: boolean;
  /** Habilita el sistema de templates en dashboards */
  DATASET_TEMPLATES_ENABLED: boolean;
}

/**
 * Feature flags activas
 */
export const datasetFeatures: DatasetFeatureFlags = {
  DATASET_EDIT_ENABLED: import.meta.env.VITE_FEATURE_DATASET_EDIT_ENABLED === 'true',
  DATASET_TEMPLATES_ENABLED: import.meta.env.VITE_FEATURE_DATASET_TEMPLATES_ENABLED === 'true',
};
```

### Configurar .env local

**Archivo:** `solution-sideby/apps/client/.env.local`

```bash
# Feature Flags - Datasets
VITE_FEATURE_DATASET_EDIT_ENABLED=true
VITE_FEATURE_DATASET_TEMPLATES_ENABLED=false

# API Backend
VITE_API_BASE_URL=http://localhost:3000/api
```

**Nota:** `.env.local` debe estar en `.gitignore`. Crear `.env.example` como referencia.

---

## ✅ Task 5.2: Actualizar `DatasetCard` con botones

### Paso 1: Agregar props de navegación

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/DatasetCard.tsx`

```typescript
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, BarChart3, Trash2, Calendar } from 'lucide-react';
import { Dataset } from '../models/Dataset';
import { datasetFeatures } from '@/config/features';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DatasetCardProps {
  /** Dataset a renderizar */
  dataset: Dataset;
  
  /** Callback cuando se hace click en "Edit" */
  onEdit?: (id: string) => void;
  
  /** Callback cuando se hace click en "Dashboard" */
  onOpenDashboard: (id: string) => void;
  
  /** Callback cuando se hace click en "Delete" */
  onDelete?: (id: string) => void;
  
  /** Estado de loading durante delete */
  isDeleting?: boolean;
}

/**
 * Tarjeta individual de dataset con botones de acción
 * 
 * Features:
 * - Muestra metadata básica (nombre, descripción, fecha)
 * - Botón Edit (solo si feature flag activo)
 * - Botón Dashboard (siempre visible)
 * - Botón Delete (con confirmación)
 * - Badge de status
 */
export const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  onEdit,
  onOpenDashboard,
  onDelete,
  isDeleting = false,
}) => {
  /**
   * Obtiene el color del badge según el status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'error':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  /**
   * Formatea la fecha relativa (ej: "hace 2 días")
   */
  const formatRelativeDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es,
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-lg leading-none">
              {dataset.meta.name}
            </h3>
            {dataset.meta.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {dataset.meta.description}
              </p>
            )}
          </div>
          
          <Badge
            variant="secondary"
            className={getStatusColor(dataset.status)}
          >
            {dataset.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {/* Fechas */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatRelativeDate(dataset.meta.createdAt)}</span>
          </div>

          {/* Grupos comparativos */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataset.sourceConfig.groupA.color }}
              />
              <span className="text-xs">{dataset.sourceConfig.groupA.label}</span>
            </div>
            <span className="text-xs">vs</span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataset.sourceConfig.groupB.color }}
              />
              <span className="text-xs">{dataset.sourceConfig.groupB.label}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Botón Edit - Solo si feature flag activo */}
          {datasetFeatures.DATASET_EDIT_ENABLED && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(dataset.id)}
              disabled={isDeleting}
              className="gap-1.5"
              aria-label="Edit dataset"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          )}

          {/* Botón Dashboard - Siempre visible */}
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenDashboard(dataset.id)}
            disabled={isDeleting || dataset.status !== 'ready'}
            className="gap-1.5"
            aria-label="Open dashboard"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>

        {/* Botón Delete */}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(dataset.id)}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete dataset"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
```

---

## ✅ Task 5.3: Actualizar `DatasetsList` con navegación

### Paso 1: Implementar handlers de navegación

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/DatasetsList.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DatasetCard } from '../components/DatasetCard';
import { EmptyDatasets } from '../components/EmptyDatasets';
import { useDatasets } from '../hooks/useDatasets';
import { useDeleteDataset } from '../hooks/useDeleteDataset';
import { toast } from '@/hooks/use-toast';

/**
 * Página principal de gestión de datasets
 * 
 * Features:
 * - Lista de datasets con React Query
 * - Navegación a /datasets/:id (Edit)
 * - Navegación a /datasets/:id/dashboard (Dashboard)
 * - Delete con confirmación y optimistic update
 * - Create nuevo dataset (wizard)
 */
export const DatasetsList: React.FC = () => {
  const navigate = useNavigate();

  // ✅ React Query hooks
  const { data: datasets = [], isLoading, error, refetch } = useDatasets();
  const deleteMutation = useDeleteDataset();

  /**
   * Navega a la página de edición del dataset
   * (Solo si feature flag DATASET_EDIT_ENABLED = true)
   */
  const handleEdit = (id: string) => {
    navigate(`/datasets/${id}`);
  };

  /**
   * Navega al dashboard del dataset
   */
  const handleOpenDashboard = (id: string) => {
    navigate(`/datasets/${id}/dashboard`);
  };

  /**
   * Elimina un dataset con confirmación
   * Usa optimistic update para UX instantánea
   */
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      '¿Estás seguro de eliminar este dataset? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Dataset eliminado',
        description: 'El dataset se ha eliminado correctamente.',
      });
    } catch (err) {
      toast({
        title: 'Error al eliminar',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  /**
   * Navega al wizard de creación de dataset
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
                    role="presentation"
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
                        onEdit={handleEdit}
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

---

## ✅ Task 5.4: Configurar rutas en React Router

### Actualizar archivo de rutas

**Archivo:** `solution-sideby/apps/client/src/routes/index.tsx`

```typescript
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Dataset pages
import { DatasetsList } from '@/features/dataset/pages/DatasetsList';
import { DatasetDetail } from '@/features/dataset/pages/DatasetDetail'; // Crear en Phase 6
import { DatasetDashboard } from '@/features/dataset/pages/DatasetDashboard'; // Crear en Phase 7
import { DataUploadWizard } from '@/features/dataset/pages/DataUploadWizard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/datasets',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <DatasetsList />,
      },
      {
        path: 'new',
        element: <DataUploadWizard />,
      },
      {
        path: ':id',
        element: <DatasetDetail />, // ⚠️ Crear en Phase 6
      },
      {
        path: ':id/dashboard',
        element: <DatasetDashboard />, // ⚠️ Crear en Phase 7
      },
    ],
  },
]);
```

**Nota:** Las páginas `DatasetDetail` y `DatasetDashboard` se crearán en las siguientes fases. 
Por ahora, puedes crear placeholders:

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/DatasetDetail.tsx`

```typescript
import { useParams } from 'react-router-dom';

export const DatasetDetail = () => {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1>Dataset Detail - {id}</h1>
      <p>✅ Placeholder (se implementará en Phase 6)</p>
    </div>
  );
};
```

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/DatasetDashboard.tsx`

```typescript
import { useParams } from 'react-router-dom';

export const DatasetDashboard = () => {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1>Dataset Dashboard - {id}</h1>
      <p>✅ Placeholder (se implementará en Phase 7)</p>
    </div>
  );
};
```

---

## ✅ Task 5.5: Tests de navegación y feature flags

### Test de DatasetCard con feature flags

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/__tests__/DatasetCard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatasetCard } from '../DatasetCard';
import { Dataset } from '../../models/Dataset';
import * as features from '@/config/features';

const mockDataset: Dataset = {
  id: '123',
  ownerId: 'user1',
  status: 'ready',
  meta: {
    name: 'Test Dataset',
    description: 'Test description',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  sourceConfig: {
    groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 100 },
    groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 100 },
  },
  data: [],
};

describe('DatasetCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnOpenDashboard = vi.fn();
  const mockOnDelete = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar botón "Edit" si feature flag está activo', () => {
    vi.spyOn(features, 'datasetFeatures', 'get').mockReturnValue({
      DATASET_EDIT_ENABLED: true,
      DATASET_TEMPLATES_ENABLED: false,
    });

    render(
      <DatasetCard
        dataset={mockDataset}
        onEdit={mockOnEdit}
        onOpenDashboard={mockOnOpenDashboard}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByLabelText('Edit dataset')).toBeInTheDocument();
  });

  it('NO debe mostrar botón "Edit" si feature flag está desactivado', () => {
    vi.spyOn(features, 'datasetFeatures', 'get').mockReturnValue({
      DATASET_EDIT_ENABLED: false,
      DATASET_TEMPLATES_ENABLED: false,
    });

    render(
      <DatasetCard
        dataset={mockDataset}
        onEdit={mockOnEdit}
        onOpenDashboard={mockOnOpenDashboard}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByLabelText('Edit dataset')).not.toBeInTheDocument();
  });

  it('debe llamar onEdit con el id correcto', async () => {
    vi.spyOn(features, 'datasetFeatures', 'get').mockReturnValue({
      DATASET_EDIT_ENABLED: true,
      DATASET_TEMPLATES_ENABLED: false,
    });

    render(
      <DatasetCard
        dataset={mockDataset}
        onEdit={mockOnEdit}
        onOpenDashboard={mockOnOpenDashboard}
      />
    );

    await userEvent.click(screen.getByLabelText('Edit dataset'));
    expect(mockOnEdit).toHaveBeenCalledWith('123');
  });

  it('debe llamar onOpenDashboard con el id correcto', async () => {
    render(
      <DatasetCard
        dataset={mockDataset}
        onEdit={mockOnEdit}
        onOpenDashboard={mockOnOpenDashboard}
      />
    );

    await userEvent.click(screen.getByLabelText('Open dashboard'));
    expect(mockOnOpenDashboard).toHaveBeenCalledWith('123');
  });

  it('debe deshabilitar Dashboard si status no es "ready"', () => {
    const processingDataset = { ...mockDataset, status: 'processing' as const };

    render(
      <DatasetCard
        dataset={processingDataset}
        onOpenDashboard={mockOnOpenDashboard}
      />
    );

    expect(screen.getByLabelText('Open dashboard')).toBeDisabled();
  });

  it('debe mostrar confirmación antes de delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <DatasetCard
        dataset={mockDataset}
        onOpenDashboard={mockOnOpenDashboard}
        onDelete={mockOnDelete}
      />
    );

    await userEvent.click(screen.getByLabelText('Delete dataset'));

    // No debe llamar onDelete si se cancela
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});
```

**Ejecutar tests:**
```bash
npm test -- DatasetCard.test.tsx
```

---

## ✅ Task 5.6: Validación Manual en Dev

### Checklist de funcionalidades

```bash
# 1. Iniciar backend
cd solution-sideby/apps/api
npm run dev

# 2. Iniciar frontend con feature flag activo
cd solution-sideby/apps/client
echo "VITE_FEATURE_DATASET_EDIT_ENABLED=true" > .env.local
npm run dev
```

**Flujo a probar:**

1. **Verificar botón "Edit" visible:**
   - [ ] Abrir http://localhost:5173/datasets
   - [ ] Ver botón "Editar" en cada DatasetCard
   - [ ] Verificar que tiene ícono `Edit2`

2. **Verificar botón "Dashboard" visible:**
   - [ ] Ver botón "Dashboard" en cada DatasetCard
   - [ ] Verificar que tiene ícono `BarChart3`
   - [ ] Si status = "processing", debe estar disabled

3. **Navegación a Edit:**
   - [ ] Click en "Editar"
   - [ ] URL cambia a `/datasets/123` (ID real)
   - [ ] Placeholder se muestra correctamente

4. **Navegación a Dashboard:**
   - [ ] Click en "Dashboard"
   - [ ] URL cambia a `/datasets/123/dashboard`
   - [ ] Placeholder se muestra correctamente

5. **Feature Flag desactivado:**
   - [ ] Cambiar `.env.local`: `VITE_FEATURE_DATASET_EDIT_ENABLED=false`
   - [ ] Reiniciar dev server (`Ctrl+C` y `npm run dev`)
   - [ ] Botón "Editar" NO debe aparecer
   - [ ] Botón "Dashboard" sigue visible

---

## 🎯 Checklist del Día 3

- [ ] Feature flags configurados en `src/config/features.ts`
- [ ] `.env.local` creado con `VITE_FEATURE_DATASET_EDIT_ENABLED=true`
- [ ] `DatasetCard` actualizado con botones Edit y Dashboard
- [ ] Navegación implementada en `DatasetsList`
- [ ] Rutas configuradas en React Router (`/datasets/:id`, `/datasets/:id/dashboard`)
- [ ] Placeholders creados para páginas futuras
- [ ] Tests de feature flags pasando
- [ ] Tests de navegación pasando
- [ ] Validación manual completada (5 flujos)

---

## 📍 Estado Esperado al Finalizar

✅ **Feature flag system funcional**  
✅ **Botones de navegación visibles**  
✅ **Rutas configuradas correctamente**  
✅ **Edit button hidden/shown según flag**  
✅ **Dashboard button siempre visible**  
✅ **Tests pasando** (unit + integration)

---

## 🚨 Troubleshooting

### Problema: Feature flag no cambia después de modificar .env.local

**Causa:** Vite no recarga automáticamente archivos .env

**Solución:** Reiniciar dev server (`Ctrl+C` y `npm run dev`)

---

### Problema: Navigate no funciona (page not found)

**Causa:** Ruta no configurada en router

**Solución:** Verificar que la ruta existe en `src/routes/index.tsx`

---

### Problema: Botón "Dashboard" no se deshabilita con status "processing"

**Causa:** Condición `disabled` incorrecta

**Solución:** Verificar:
```typescript
disabled={isDeleting || dataset.status !== 'ready'}
```

---

## ✨ Siguiente Paso

**Ahora implementaremos la página de edición:**  
📄 **`docs/design/prompts/PHASE-6-DATASET-DETAIL.md`**

---

## 📝 Commit Sugerido

```bash
git add .
git commit -m "feat(datasets): add Edit and Dashboard navigation

- Implemented feature flag system for Edit button
- Added Edit and Dashboard buttons to DatasetCard
- Configured routes for /datasets/:id and /datasets/:id/dashboard
- Created placeholders for detail and dashboard pages
- All navigation tests passing

Feature flags:
- VITE_FEATURE_DATASET_EDIT_ENABLED controls Edit button visibility
- Dashboard button always visible for ready datasets
"
```

---

**¡Excelente! Ahora la navegación está lista. Siguiente paso: la página de edición. 🚀**
