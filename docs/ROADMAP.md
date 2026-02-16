# ROADMAP - SideBy

Este documento describe las mejoras futuras y características planificadas para el proyecto SideBy, organizadas por RFC (Request for Comments).

## Propósito

El ROADMAP sirve para:
- **Documentar mejoras identificadas** durante el desarrollo que no son críticas para el MVP
- **Priorizar features** para futuras iteraciones
- **Mantener contexto técnico** de decisiones arquitectónicas
- **Facilitar la planificación** de sprints futuros

---

## RFC-001: AUTH & IDENTITY

### Mejoras Planificadas

_Pendiente: Agregar mejoras identificadas para autenticación e identidad_

---

## RFC-002: DATA INGESTION

### Mejoras Planificadas

### 🧹 Dataset Cleanup Job (Limpieza Automática de Datasets Abandonados)

**Estado:** Propuesta  
**Prioridad:** Baja  
**Esfuerzo Estimado:** 1-2 días  
**Versión Target:** v0.4.0

#### Contexto

Durante la implementación del módulo de Datasets (RFC-003), se identificó la necesidad de un mecanismo de limpieza automática para datasets que quedan en estado `processing` indefinidamente. Estos datasets "abandonados" ocupan espacio en la base de datos sin aportar valor.

**Escenario problemático:**
1. Usuario sube dos archivos CSV (Paso 1)
2. Los archivos se procesan correctamente y el dataset queda en `status: processing`
3. Usuario abandona el flujo sin completar el Paso 3 (configuración de mapping)
4. El dataset queda huérfano, ocupando espacio innecesariamente

#### Solución Propuesta

Implementar un **Cron Job** que ejecute periódicamente una tarea de limpieza:

1. **Buscar datasets abandonados:**
   ```typescript
   const cutoffDate = new Date();
   cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 horas
   
   const abandoned = await repository.findAbandoned(cutoffDate);
   // Retorna datasets con status="processing" y createdAt < cutoffDate
   ```

2. **Eliminar datasets automáticamente:**
   ```typescript
   for (const dataset of abandoned) {
     await repository.delete(dataset.id);
     logger.info(`Deleted abandoned dataset: ${dataset.id}`);
   }
   ```

3. **Configuración vía variables de entorno:**
   ```env
   CLEANUP_JOB_ENABLED=true
   CLEANUP_JOB_SCHEDULE="0 2 * * *"  # Diario a las 2 AM
   ABANDONED_DATASET_HOURS=24        # Considerar abandonado después de 24h
   ```

#### Implementación

**Archivo:** `src/modules/datasets/jobs/cleanup-abandoned.job.ts`

```typescript
import { MongoDatasetRepository } from '../infrastructure/mongoose/MongoDatasetRepository.js';
import { DatasetRules } from '../domain/validation.rules.js';
import logger from '@/utils/logger.js';

export async function cleanupAbandonedDatasets(): Promise<void> {
  try {
    const repository = new MongoDatasetRepository();
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - DatasetRules.ABANDONED_DATASET_HOURS);

    const abandoned = await repository.findAbandoned(cutoffDate);
    logger.info(`Found ${abandoned.length} abandoned datasets`);

    for (const dataset of abandoned) {
      await repository.delete(dataset.id);
      logger.info(`Deleted abandoned dataset: ${dataset.id}`);
    }

    logger.info('Cleanup job completed successfully');
  } catch (error) {
    logger.error({ err: error }, 'Cleanup job failed');
  }
}
```

**Integración con node-cron:**

```typescript
// En src/index.ts o src/jobs/scheduler.ts
import cron from 'node-cron';
import { cleanupAbandonedDatasets } from '@/modules/datasets/jobs/cleanup-abandoned.job.js';

// Ejecutar diariamente a las 2 AM
if (process.env.CLEANUP_JOB_ENABLED === 'true') {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting dataset cleanup job');
    await cleanupAbandonedDatasets();
  });
}
```

#### Tareas de Implementación

- [ ] Crear archivo `cleanup-abandoned.job.ts`
- [ ] Instalar dependencia `node-cron`
- [ ] Añadir configuración en `.env` y `.env.example`
- [ ] Integrar scheduler en `index.ts`
- [ ] Crear tests unitarios del job
- [ ] Documentar en README de operaciones
- [ ] Configurar monitoreo/alertas (opcional)

#### Consideraciones

- **Notificación al usuario:** En v0.5.0, considerar enviar email de aviso antes de eliminar
- **Soft delete:** Implementar eliminación lógica en lugar de física (preservar para auditoría)
- **Métricas:** Trackear número de datasets eliminados para análisis de abandono

---

## RFC-003: SCHEMA MAPPING

### 🔄 Toggle de Tipo de Columna (Column Type Override)

**Estado:** Propuesta  
**Prioridad:** Media  
**Esfuerzo Estimado:** 3-5 días  
**Versión Target:** v0.3.0

#### Contexto

Durante la implementación del **RFC-003-A (Simplified Auto-Mapping UI)**, se identificó una limitación del sistema de auto-clasificación:

- **Problema:** El campo "Year" (Año) es detectado automáticamente como **métrica numérica** (ej: 2023, 2024)
- **Realidad:** En la mayoría de casos, "Year" es conceptualmente una **dimensión categórica** para segmentar datos
- **Impacto:** El usuario no puede usar "Year" para agrupar/filtrar datos, solo como valor numérico

#### Solución Propuesta

Implementar un **sistema de toggle de tipo de columna** que permita al usuario:

1. **Override manual del tipo auto-detectado:**
   - Cambiar una columna de "Métrica" → "Dimensión"
   - Cambiar una columna de "Dimensión" → "Métrica"
   - Cambiar "Fecha" → "Dimensión" (caso de Year/Month strings)

2. **Transformación de datos:**
   ```typescript
   // Ejemplo: Year 2023 (number) → "2023" (string)
   if (typeOverride === 'dimension' && originalType === 'numeric') {
     transformedValue = String(originalValue);
   }
   ```

3. **Persistencia del override:**
   ```typescript
   interface ColumnMapping {
     [columnName: string]: {
       sourceColumn: string;
       targetColumn: string;
       format: KPIFormat; // 'number' | 'currency' | 'string' | 'date'
       originalType?: 'numeric' | 'string' | 'date';  // Nuevo
       typeOverride?: 'metric' | 'dimension' | 'date'; // Nuevo
     };
   }
   ```

#### Diseño de UI

**Opción A - Botón Toggle Inline:**
```
✓ [Year]          [Métrica ⇄ Dimensión]
✓ [Revenue]       [Métrica]
✓ [Product Name]  [Dimensión]
```

**Opción B - Dropdown de Tipo:**
```
✓ [Year]          [▼ Dimensión]  (Detectado: Métrica)
                      ├─ Métrica
                      ├─ Dimensión
                      └─ Fecha
```

**Recomendación:** Opción B es más flexible y permite todos los cambios de tipo.

#### Casos de Uso

1. **Year como Dimensión:**
   ```
   Detectado: Métrica (2023, 2024)
   Override:  Dimensión → "2023", "2024"
   Uso:       Filtrar/agrupar por año
   ```

2. **ID numérico como Dimensión:**
   ```
   Detectado: Métrica (10001, 10002)
   Override:  Dimensión → "10001", "10002"
   Uso:       Identificador único, no agregable
   ```

3. **Month string como Fecha:**
   ```
   Detectado: Dimensión ("2024-01", "2024-02")
   Override:  Fecha → Parse como Date
   Uso:       Gráfico de evolución temporal
   ```

#### Tareas de Implementación

- [ ] **Backend (API):**
  - [ ] Extender `ColumnMapping` type con `originalType` y `typeOverride`
  - [ ] Agregar lógica de transformación en data processing pipeline
  - [ ] Tests unitarios para transformaciones de tipo

- [ ] **Frontend (Client):**
  - [ ] UI: Agregar dropdown/toggle de tipo en `ColumnMappingStep`
  - [ ] State: Actualizar `useWizardState` para manejar overrides
  - [ ] Validation: Prevenir overrides inválidos (ej: text → numeric)
  - [ ] Tests: Vitest + RTL para interacciones de toggle

- [ ] **Integration:**
  - [ ] End-to-end test para flujo completo con override
  - [ ] Documentación de usuario (capturas UI)

#### Referencias

- **Archivo:** `solution-sideby/apps/client/src/features/dataset/components/wizard/ColumnMappingStep.simplified.tsx`
- **Función Auto-Clasificación:** `solution-sideby/apps/client/src/features/dataset/utils/autoClassify.ts`
- **Types:** `solution-sideby/apps/client/src/features/dataset/types/wizard.types.ts`

#### Notas Técnicas

- **Backward Compatibility:** Los mappings sin `typeOverride` usarán el tipo auto-detectado (no breaking change)
- **Validación:** No permitir override de `date` → `numeric` (pérdida de información)
- **Performance:** Transformaciones de tipo se ejecutan una sola vez durante import, no en runtime

---

### ⚡ Migración a React Query (TanStack Query) para Server State

**Estado:** ✅ Diseño Completado (ver RFC-React-Query-Migration)  
**Prioridad:** Alta - Requerido para RFC-004  
**Esfuerzo Estimado:** 2 días  
**Versión Target:** v0.3.1  
**RFC:** `docs/design/RFC-React-Query-Migration.md`

#### Contexto

Actualmente, el frontend maneja el **server state** (datos del backend) con hooks manuales basados en `useState` + `useEffect`. Esta implementación funciona pero tiene limitaciones:

**Problemas Actuales:**
1. **Sin cache:** Cada vez que se monta un componente, se hace fetch de nuevo
2. **Sin sincronización:** Si actualizas un dataset en una página, otras páginas no se refrescan
3. **Código boilerplate:** Cada hook repite la misma lógica de loading/error/data
4. **Sin optimistic updates:** La UI se actualiza solo después de la respuesta del servidor
5. **Sin deduplicación:** Si 2 componentes piden el mismo dato, hace 2 requests
6. **Sin revalidación:** No hay estrategia de stale-while-revalidate

**Ejemplo de código actual (manual):**
```typescript
// features/dataset/hooks/useDataset.ts (ACTUAL)
export function useDataset(datasetId: string | null) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasetId) {
      setIsLoading(true);
      getDataset(datasetId)
        .then(setDataset)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [datasetId]);

  return { dataset, isLoading, error };
}
```

#### Solución Propuesta

Migrar a **React Query (TanStack Query v5)** para aprovechar:

1. **Cache inteligente:** Los datasets se cachean automáticamente por `queryKey`
2. **Invalidación automática:** Después de un `PATCH`, invalidar el cache del `GET`
3. **Estados simplificados:** No más boilerplate de `useState` para loading/error/data
4. **Optimistic updates:** Actualizar UI antes de que responda el servidor
5. **Deduplicación:** Múltiples componentes pueden usar la misma query sin duplicar requests
6. **Revalidación automática:** Datos frescos al volver a la pestaña (stale-while-revalidate)
7. **DevTools:** Panel de debugging para ver queries y cache en tiempo real

**Ejemplo con React Query (PROPUESTO):**
```typescript
// features/dataset/hooks/useDataset.ts (CON REACT QUERY)
import { useQuery } from '@tanstack/react-query';

export function useDataset(datasetId: string | null) {
  return useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => getDataset(datasetId!),
    enabled: !!datasetId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

**Beneficio de invalidación automática:**
```typescript
// features/dataset/hooks/useDatasetMapping.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDatasetMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateMapping(id, payload),
    onSuccess: (_, { id }) => {
      // ✅ Invalida automáticamente el GET del dataset
      queryClient.invalidateQueries({ queryKey: ['dataset', id] });
      // ✅ También invalida la lista de datasets
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}
```

#### Alcance de Migración

**Módulos a migrar:**

1. **Datasets Module:**
   - `useDataset` → `useQuery`
   - `useDatasetsList` → `useQuery`
   - `useDatasetUpload` → `useMutation`
   - `useDatasetMapping` → `useMutation`
   - `useDeleteDataset` → `useMutation` (si existe)

2. **Auth Module (opcional):**
   - `useUser` → `useQuery` (perfil de usuario)
   - `useLogin` / `useRegister` → `useMutation`

3. **Future Modules:**
   - Cualquier nuevo módulo que haga fetching de datos del backend

#### Implementación

**Paso 1: Instalación**
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Paso 2: Setup del QueryClient**
```typescript
// src/infrastructure/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

**Paso 3: Wrapping en App.tsx**
```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/infrastructure/api/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* App content */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Paso 4: Migrar hooks uno por uno**

Ejemplo de migración completa:

```typescript
// ANTES (manual)
export function useDatasetsList() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    listDatasets()
      .then(setDatasets)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { datasets, isLoading, error };
}

// DESPUÉS (React Query)
export function useDatasetsList() {
  return useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });
}
```

#### Tareas de Implementación

- [ ] **Setup:**
  - [ ] Instalar `@tanstack/react-query` y `@tanstack/react-query-devtools`
  - [ ] Crear `queryClient.ts` con configuración por defecto
  - [ ] Wrappear App con `QueryClientProvider`
  - [ ] Habilitar DevTools en modo desarrollo

- [ ] **Migración de Hooks (Datasets):**
  - [ ] `useDataset` → `useQuery`
  - [ ] `useDatasetsList` → `useQuery`
  - [ ] `useDatasetUpload` → `useMutation` con invalidación
  - [ ] `useDatasetMapping` → `useMutation` con invalidación
  - [ ] `useDeleteDataset` → `useMutation` con invalidación

- [ ] **Tests:**
  - [ ] Actualizar tests de hooks para usar `QueryClientProvider` wrapper
  - [ ] Crear utils para testing con React Query (`createTestQueryClient`)
  - [ ] Tests de invalidación de cache

- [ ] **Optimizaciones:**
  - [ ] Implementar optimistic updates para mutations
  - [ ] Configurar `staleTime` y `cacheTime` por query según necesidades
  - [ ] Prefetching de datasets en lista (hover)

- [ ] **Documentación:**
  - [ ] Actualizar README del módulo frontend
  - [ ] Documentar convenciones de queryKeys (`['entity', id]`)
  - [ ] Guía de uso de DevTools

#### Beneficios Esperados

**UX:**
- ⚡ Respuesta instantánea al volver a páginas visitadas (cache)
- ✅ Sincronización automática entre páginas (invalidación)
- 🎯 Feedback inmediato en acciones del usuario (optimistic updates)

**DX (Developer Experience):**
- 📉 Menos código boilerplate (de ~15 líneas a ~5 líneas por hook)
- 🐛 Debugging más fácil con DevTools
- 🔄 Sincronización de estado sin lógica manual

**Performance:**
- 🚀 Menos requests al servidor (deduplicación)
- 📦 Cache inteligente (stale-while-revalidate)
- ⏱️ Prefetching para navegación anticipada

#### Referencias

- **Docs Oficiales:** https://tanstack.com/query/latest
- **Migration Guide:** https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5
- **Best Practices:** https://tkdodo.eu/blog/practical-react-query

#### Riesgos y Mitigaciones

**Riesgo 1:** Curva de aprendizaje del equipo
- **Mitigación:** Workshop interno + documentación interna con ejemplos

**Riesgo 2:** Breaking changes en hooks existentes
- **Mitigación:** Migración gradual, mantener hooks legacy temporalmente con deprecation warnings

**Riesgo 3:** Gestión de cache compleja
- **Mitigación:** Definir convenciones claras de `queryKeys` desde el inicio

#### Notas Técnicas

- **Compatibilidad:** React Query v5 requiere React 18+ (ya lo usamos)
- **Bundle Size:** ~15KB gzipped (aceptable para los beneficios)
- **SSR compatible:** Para futuro Server-Side Rendering si se requiere

---

## RFC-004: DATASET MANAGEMENT UI

### ✅ Dataset Dashboard Template System (Lista, Detalle, Edit & Dashboard)

**Estado:** ✅ Diseño Completado (ver RFC-004-DASHBOARD-TEMPLATE)  
**Prioridad:** Alta  
**Esfuerzo Estimado:** 4-5 días (post React Query migration)  
**Versión Target:** v0.4.0  
**RFC:** `docs/design/RFC-004-DASHBOARD-TEMPLATE.md`  
**Dependencias:** RFC-React-Query-Migration (DEBE completarse primero)

#### Contexto

Actualmente, el flujo de datasets termina en el paso 3 (configuración de mapping). No existe una UI completa para visualizar, editar y explorar datasets creados.

**RFC-004 implementa:**

1. **DatasetsList Update:** Conectar con API real + botones Edit/Dashboard con feature flag
2. **DatasetDetail Page:** Edición de metadatos (labels, colors, KPI labels, AI config)
3. **DatasetDashboard:** Sistema de templates para visualización comparativa
4. **Dashboard Templates:** Templates predefinidos (Executive, Trends, Detailed)
5. **Dynamic Filters:** Filtros por dimensiones categóricas que actualizan toda la vista

#### Arquitectura de Solución

**Routing:**
```
/datasets              → DatasetsList (lista con API real)
/datasets/new          → DataUploadWizard (existente)
/datasets/:id          → DatasetDetail (edición con feature flag)
/datasets/:id/dashboard → DatasetDashboard (templates + filtros)
```

**Feature Flag:**
```typescript
FEATURES.DATASET_EDIT_ENABLED = import.meta.env.VITE_FEATURE_DATASET_EDIT_ENABLED === "true"
```

**Campos Editables:**
- `meta.name`, `meta.description`
- `sourceConfig.groupA/B.label`, `sourceConfig.groupA/B.color`
- `schemaMapping.kpiFields[].label`, `schemaMapping.kpiFields[].format`
- `aiConfig.enabled`, `aiConfig.userContext`

**Sistema de Templates:**
```typescript
type DashboardTemplateId = 'sideby_executive' | 'sideby_trends' | 'sideby_detailed';

// sideby_executive: 4 KPIs + gráfico principal + tabla
// sideby_trends: Multiple charts con evolución temporal
// sideby_detailed: Tabla completa de datos raw
```

#### Implementación con React Query

**Hooks principales:**

```typescript
// Queries (READ)
useDatasets()           // Lista con cache automático
useDataset(id)          // Detalle individual

// Mutations (WRITE) con optimistic updates
useUpdateDataset()      // PATCH con invalidación automática
useDeleteDataset()      // DELETE con optimistic removal

// Dashboard Logic
useDatasetDashboard(id) // Filtros + KPI calculations + Template management
```

**Invalidación de Cache:**
```typescript
// Después de updateDataset, React Query invalida automáticamente:
queryClient.invalidateQueries({ queryKey: ['dataset', id] });  // ✅ Detalle se actualiza
queryClient.invalidateQueries({ queryKey: ['datasets'] });     // ✅ Lista se actualiza
// ✅ Dashboard también se actualiza (usa misma queryKey)
```

#### Dashboard Features

1. **KPI Comparison:**
   - Suma automática de métricas por grupo (groupA vs groupB)
   - Cálculo de % de cambio
   - Formato según KPIField.format (number/currency/percentage)

2. **Dynamic Filters:**
   - Dropdown por cada categoricalField
   - Filtrado aplicado a KPIs, gráficos y tabla
   - Active filters con chips removibles
   - "Limpiar filtros" button

3. **Template Switcher:**
   - Select dropdown para cambiar entre templates
   - Re-renderizado de componentes según template activo
   - State persiste en URL (futuro)

4. **Visualizations:**
   - KPIGrid (4 cards máximo para Executive)
   - ComparisonChart (Line/Area/Bar según template)
   - ComparisonTable (datos tabulares)
   - AIInsights (análisis con IA si habilitado)

#### Tareas de Implementación

**Fase 1: React Query Foundation (2 días)**
- [x] Diseño completado en RFC-React-Query-Migration
- [ ] Implementar migration checklist
- [ ] Tests actualizados con QueryClientProvider wrapper

**Fase 2: DatasetsList Update (0.5 días)**
- [ ] Conectar `useDatasets` con API real
- [ ] Actualizar `DatasetCard` con botones Edit/Dashboard
- [ ] Feature flag `VITE_FEATURE_DATASET_EDIT_ENABLED`
- [ ] Tests de navegación

**Fase 3: DatasetDetail (1.5 días)**
- [ ] Hook `useUpdateDataset` con optimistic updates
- [ ] Página con React Hook Form + Zod validation
- [ ] Secciones: General, Grupos, KPIs, IA
- [ ] Color pickers para grupos
- [ ] Tests de formulario y mutations

**Fase 4: Dashboard Template System (2 días)**
- [ ] Types: `DashboardTemplateId`, `TemplateConfig`
- [ ] Hook `useDatasetDashboard` (filtros + KPIs + template)
- [ ] Component `TemplateRenderer` (renderizado dinámico)
- [ ] Component `DashboardFilters` (dropdowns + chips)
- [ ] Components: `KPIGrid`, `ComparisonChart`, `ComparisonTable`
- [ ] Template switcher UI
- [ ] Tests de cálculos y filtros

**Fase 5: Integration & Polish (1 día)**
- [ ] Routing completo
- [ ] Loading states (Skeletons)
- [ ] Error boundaries
- [ ] Empty states
- [ ] Tests E2E del flujo completo
- [ ] Performance testing

#### Limitaciones Conocidas & Tareas Pendientes Backend

### 🔧 Backend: Soportar edición de `sourceConfig` en endpoint PATCH

**Estado:** Pendiente (Bloqueador para edición completa de grupos)  
**Prioridad:** Media  
**Esfuerzo Estimado:** 1 día  
**Versión Target:** v0.4.1  
**Bloqueado por:** Phase 6 de RFC-004

#### Contexto

Durante la implementación de **Phase 6: DatasetDetail Edit Page** (RFC-004), se identificó que el backend endpoint `PATCH /api/v1/datasets/:id` **NO soporta actualizar `sourceConfig`**.

**Schema actual (UpdateMappingSchema):**
```typescript
{
  meta: { name, description },           // ✅ Soportado
  schemaMapping: { ... },                // ✅ Soportado
  dashboardLayout: { ... },              // ✅ Soportado
  aiConfig: { enabled, userContext }     // ✅ Soportado
  // ❌ sourceConfig NO está en el schema
}
```

**Problema:**
- Frontend permite mostrar y eventualmente editar `sourceConfig.groupA/B.label` y `sourceConfig.groupA/B.color`
- Backend rechaza el payload si se envía `sourceConfig` (Zod validation error)
- Los labels y colores de grupos son **inmutables** después del upload inicial

#### Solución Propuesta

**Opción A: Extender UpdateMappingSchema (Recomendada)**

Actualizar el schema Zod para aceptar cambios en labels y colores:

```typescript
// apps/api/src/modules/datasets/presentation/validators/datasets.schemas.ts

export const UpdateMappingSchema = z.object({
  meta: z.object({ ... }),
  schemaMapping: z.object({ ... }),
  dashboardLayout: z.object({ ... }),
  aiConfig: z.object({ ... }).optional(),
  
  // ✨ NUEVO: Permitir editar configuración de grupos
  sourceConfig: z.object({
    groupA: z.object({
      label: z.string().min(1).max(50),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      // originalFileName y rowCount NO editables
    }).partial(),
    groupB: z.object({
      label: z.string().min(1).max(50),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    }).partial(),
  }).optional(),
});
```

**Opción B: Endpoint separado (Menos prioritario)**

Crear `PATCH /api/v1/datasets/:id/groups` específico para editar grupos:
- Ventaja: Separación de responsabilidades
- Desventaja: Más complejidad (2 mutations en frontend)

#### Tareas de Implementación

- [ ] **Backend:**
  - [ ] Actualizar `UpdateMappingSchema` con `sourceConfig` opcional
  - [ ] Validar que solo se editen `label` y `color` (no `originalFileName`, `rowCount`)
  - [ ] Actualizar `UpdateMappingUseCase` para aplicar cambios a `sourceConfig`
  - [ ] Tests unitarios para validación y actualización
  - [ ] Tests de integración para endpoint PATCH

- [ ] **Frontend (después de backend):**
  - [ ] Habilitar edición de labels y colores en `GroupConfigFields` component
  - [ ] Actualizar `useUpdateDataset` hook para enviar `sourceConfig` en payload
  - [ ] Tests de formulario con edición de grupos

#### Workaround Temporal (Phase 6)

Mientras el backend no soporte edición de `sourceConfig`:

1. **Mostrar campos como disabled** (read-only) en `GroupConfigFields.tsx`
2. **Agregar tooltip explicativo:** "Los labels y colores de grupos se configuran en el upload inicial. Próximamente podrás editarlos aquí."
3. **NO enviar `sourceConfig` en el payload** de `updateDataset` mutation
4. **Color picker visible pero disabled** (para preparar UI)

**Nota en código:**
```typescript
// GroupConfigFields.tsx
// TODO: Habilitar edición cuando backend soporte PATCH de sourceConfig
// Ver: docs/ROADMAP.md → RFC-004 → Backend: Soportar edición de sourceConfig
<Input disabled value={groupALabel} ... />
```

#### Mejora Adicional: Wizard Upload con Nombres de Archivo

**Relacionado:** En vez de usar "Grupo A" y "Grupo B" por defecto en el wizard de upload, usar los nombres de archivo originales.

**Cambio en `DataUploadWizard`:**
```typescript
// Antes:
const defaultGroupALabel = "Grupo A"; // ❌ Genérico

// Después:
const defaultGroupALabel = fileA.name.replace(/\.csv$/i, ''); // ✅ "performance_2023"
```

Esto hace que los datasets tengan labels más descriptivos desde el inicio y reduce la necesidad de editarlos posteriormente.

#### Beneficios Esperados

**UX:**
- ✅ Ciclo CRUD completo de datasets
- ⚡ Feedback inmediato con optimistic updates (sin esperar al servidor)
- 🎨 Templates flexibles para diferentes necesidades (Executive, Trends, Detailed)
- 🔍 Filtros dinámicos que sincronizan KPIs, gráficos y tabla
- 📊 Comparación visual groupA vs groupB con colores personalizables

**DX:**
- 📦 React Query elimina ~300 líneas de boilerplate
- 🧪 Tests comprehensivos con alta cobertura
- 🏗️ Arquitectura escalable para nuevos templates
- 📚 Documentación TDD completa en RFCs

**Performance:**
- 🚀 Cache inteligente reduce requests al backend
- 📊 Cálculos de KPIs memoizados (solo recalcula si cambian filtros)
- ⏱️ Prefetching potencial al hover sobre dataset cards

#### Referencias

- **RFC Completo:** `docs/design/RFC-004-DASHBOARD-TEMPLATE.md`
- **RFC Dependency:** `docs/design/RFC-React-Query-Migration.md`
- **Componentes de Referencia:** `SideBy-Design/src/pages/Dashboard.tsx`
- **Backend Entity:** `apps/api/src/modules/datasets/domain/Dataset.entity.ts`

#### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Performance con datasets grandes (>10K rows) | Media | Alta | Virtualización en tabla, memoización, paginación en gráficos |
| Complejidad de filtros anidados | Baja | Media | Limitar a filtros simples en MVP, mejorar en v0.5 |
| Feature flag no cubre todos los casos | Media | Baja | Tests de ambos estados (enabled/disabled) |

#### Próximos Pasos (v0.5.0)

- Export dashboard a PDF
- Compartir datasets entre usuarios
- Custom templates (drag & drop editor)
- Anotaciones en gráficos
- Alertas basadas en umbrales

---

## INFRASTRUCTURE & OBSERVABILITY

### Mejoras Planificadas

### 📊 Structured Logging System with Sentry Integration

**Estado:** Propuesta  
**Prioridad:** Media  
**Esfuerzo Estimado:** S (1-3 días)  
**Versión Target:** v0.5.0

#### Contexto

Durante el desarrollo y debugging de features (ej: RFC-004 highlighted KPIs fix), se identificó la necesidad de logs estructurados que:
- Se muestren **solo en desarrollo**, no contaminen la consola en producción
- Tengan **niveles claros** (debug, info, warn, error)
- Sean **extensibles** para integrar con servicios de observability (Sentry, LogRocket)
- Mantengan **performance óptimo** en producción (sin overhead de console.log)

**Problema actual:**
```typescript
// ❌ Logs ad-hoc durante debugging
console.log('[Component] Some debug info:', data);
console.log('[Hook] State update:', state);

// Problemas:
// 1. Se ejecutan en producción (contamina consola del usuario)
// 2. Sin estructura ni niveles
// 3. Difícil de deshabilitar globalmente
// 4. No se integran con error tracking
```

#### Solución Propuesta

Implementar un **Logger Service** con detección automática de entorno:

**1. Logger Utility (`src/shared/utils/logger.ts`):**
```typescript
const isDev = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';

export const logger = {
  /**
   * Debug logs - Solo en desarrollo
   * Uso: Debugging de flujos, state changes, data transformations
   */
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...args);
  },

  /**
   * Info logs - Solo en desarrollo
   * Uso: Operaciones importantes, API calls success, milestones
   */
  info: (...args: unknown[]) => {
    if (isDev) console.info('[INFO]', ...args);
  },

  /**
   * Warning logs - Siempre mostrar
   * Uso: Deprecated APIs, fallbacks, validation warnings
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
    // TODO: Enviar a Sentry como warning
  },

  /**
   * Error logs - Siempre mostrar + Enviar a Sentry
   * Uso: Exceptions, API errors, critical failures
   */
  error: (error: Error | unknown, ...args: unknown[]) => {
    console.error('[ERROR]', error, ...args);
    // TODO: Sentry.captureException(error, { extra: { ...args } });
  },

  /**
   * Performance timing
   */
  time: (label: string) => {
    if (isDev) console.time(`[PERF] ${label}`);
  },

  timeEnd: (label: string) => {
    if (isDev) console.timeEnd(`[PERF] ${label}`);
  },
};
```

**2. Uso en Código:**
```typescript
// Componentes
import { logger } from '@/shared/utils/logger.js';

function useWizardState() {
  const setMapping = (mapping: Partial<ColumnMapping>) => {
    logger.debug('[useWizardState] setMapping called:', {
      kpiFieldsCount: mapping.kpiFields?.length,
      hasHighlighted: mapping.kpiFields?.some(k => k.highlighted),
    });
    
    setState(mapping);
  };
}

// Error Boundaries
function ErrorBoundary() {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(error, { componentStack: errorInfo.componentStack });
  }
}

// API Calls
async function fetchDataset(id: string) {
  logger.debug('[API] Fetching dataset:', id);
  logger.time('fetchDataset');
  
  try {
    const response = await axios.get(`/datasets/${id}`);
    logger.debug('[API] Dataset fetched successfully');
    return response.data;
  } catch (error) {
    logger.error(error, { datasetId: id, endpoint: '/datasets/:id' });
    throw error;
  } finally {
    logger.timeEnd('fetchDataset');
  }
}
```

**3. Sentry Integration (Fase 2):**
```typescript
import * as Sentry from '@sentry/react';

export const logger = {
  error: (error: Error | unknown, context?: Record<string, unknown>) => {
    console.error('[ERROR]', error, context);
    
    if (import.meta.env.PROD && Sentry.isInitialized()) {
      Sentry.captureException(error, {
        level: 'error',
        extra: context,
        tags: {
          feature: context?.feature || 'unknown',
        },
      });
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn('[WARN]', message, context);
    
    if (import.meta.env.PROD && Sentry.isInitialized()) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  },
};
```

#### Tareas de Implementación

**Sprint 1 - Basic Logger (1-2 días):**
- [ ] Crear `src/shared/utils/logger.ts` con métodos debug/info/warn/error
- [ ] Agregar detección de entorno (dev/test/prod)
- [ ] Implementar performance timing helpers
- [ ] Tests unitarios para logger utility

**Sprint 2 - Code Migration (1 día):**
- [ ] Migrar console.log existentes a logger.debug() en:
  - [ ] Wizard components (useWizardState, ColumnMappingStep, DataUploadWizard)
  - [ ] API hooks (useDataset, useUpdateDataset)
  - [ ] Error boundaries
- [ ] Agregar logs estratégicos en flujos críticos:
  - [ ] Dataset creation flow
  - [ ] Authentication flow
  - [ ] Data validation/parsing

**Sprint 3 - Sentry Integration (1 día):**
- [ ] Setup Sentry SDK (`@sentry/react` + `@sentry/vite-plugin`)
- [ ] Configurar Sentry.init() en `main.tsx`
- [ ] Integrar logger.error() con Sentry.captureException()
- [ ] Configurar source maps para stack traces
- [ ] Environment variables: `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`

**Sprint 4 - Documentación (0.5 días):**
- [ ] Guía de uso del logger en `docs/DEV_GUIDE.md`
- [ ] Ejemplos de logging patterns
- [ ] Configuración de Sentry en README

#### Beneficios

1. **Developer Experience:**
   - Logs estructurados facilitan debugging
   - No más console.log olvidados en producción
   - Performance timing out-of-the-box

2. **Production Monitoring:**
   - Errores capturados automáticamente en Sentry
   - Context enriquecido (user, feature, breadcrumbs)
   - Alertas en tiempo real vía Sentry

3. **Performance:**
   - logger.debug() es no-op en producción (0 overhead)
   - Conditional logging basado en entorno
   - Tree-shaking elimina código no usado

#### Referencias

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Logger Patterns:** https://12factor.net/logs
- **Related:** Error Boundary implementation (`src/shared/components/ErrorBoundary.tsx`)

#### Notas Técnicas

- **Tree-shaking:** Vite elimina automáticamente `logger.debug()` calls en prod builds si están detrás de `if (isDev)`
- **Source Maps:** Configurar `sourcemaps: true` en `vite.config.ts` solo para prod builds
- **Sentry Rate Limits:** Configurar sample rates para no exceder free tier (10k events/month)

---

## RFC-005: Dashboard UX Improvements

### Mejoras Implementadas (v0.5.0)

✅ **Multi-select Filters:** Permite seleccionar múltiples valores en cada dimensión  
✅ **Active Filter Chips:** Chips removibles con botón "Limpiar todos"  
✅ **Enhanced Template Selector:** Selector mejorado con íconos y descripciones  

Ver detalles en: [`docs/design/RFC-005-DASHBOARD-UX-IMPROVEMENTS.md`](design/RFC-005-DASHBOARD-UX-IMPROVEMENTS.md)

### Mejoras Pendientes (v0.6.0)

**🔄 Auto-save Template Preference**

**Estado:** Pendiente  
**Prioridad:** Media  
**Esfuerzo Estimado:** 1-2 días (0.5d Backend + 1d Frontend + 0.5d Testing)  
**Versión Target:** v0.6.0  
**Bloqueador:** Requiere endpoint backend que acepte `dashboardLayout.templateId`

#### Contexto

Durante la implementación de RFC-005, se identificó que el selector de templates mejorado necesita persistir la preferencia del usuario. Actualmente el template seleccionado se pierde al recargar la página.

**User Story:**
> Como usuario, cuando cambio de "Resumen Ejecutivo" a "Análisis de Tendencias", quiero que mi preferencia se guarde automáticamente para que la próxima vez que abra el dashboard se muestre la misma vista.

#### Solución Propuesta

**Backend (0.5 días):**
- Extender endpoint `PATCH /api/v1/datasets/:id` para aceptar:
  ```json
  { "dashboardLayout": { "templateId": "sideby_trends" } }
  ```
- Validar `templateId` como enum válido
- Manejo de errores para template inválido

**Frontend (1 día):**
- Implementar auto-save con debounce (2 segundos después del cambio)
- Visual feedback: "Guardando..." → "✓ Guardado" → "No guardado"
- Integración con `useUpdateDataset` mutation hook
- Error handling silencioso con logging (no toasts intrusivos)
- Tests con fake timers para validar debounce

**Testing (0.5 días):**
- Unit tests: lógica de debounce y estado de guardado
- Integration tests: mutation + cache invalidation
- E2E test: Cambiar template → Recargar página → Validar persistencia

#### Referencias
- Component: `components/dashboard/TemplateSelector.tsx`
- Hook: `hooks/useUpdateDataset.ts`

---

## RFC-006: Dashboard Visualization Enhancements

### Mejoras Planificadas (v0.6.0)

📅 **Date Umbrella System:** Sistema para alinear fechas de diferentes períodos  
📊 **Executive View:** KPI cards con sparklines + gráfico configurable  
📈 **Trends View:** Grid 2×2 de mini-charts con trend indicators  
📋 **Detailed View:** Tabla totales + tabla granular con deltas y export CSV  

🧭 **KPIs con métrica inversa:** Soporte para métricas donde “menos es mejor” (ej: costos, churn, tiempos).  
Requiere persistir un flag por KPI y ajustar cálculo de tendencia/colores.

Ver detalles en: [`docs/design/RFC-006-DASHBOARD-VISUALIZATION-ENHANCEMENTS.md`](design/RFC-006-DASHBOARD-VISUALIZATION-ENHANCEMENTS.md)

---

## RFC-007: Dashboard PDF Export

### Mejoras Planificadas (v0.7.0)

📄 **PDF Export System:** Exportación interactiva de dashboards a PDF  
🔗 **Interactive Links:** PDFs con links funcionales al dashboard online  
⚙️ **Section Selector:** Usuario elige qué secciones exportar  
🎨 **A4 Optimized:** Layout optimizado para impresión profesional  

Ver detalles en: [`docs/design/RFC-007-DASHBOARD-PDF-EXPORT.md`](design/RFC-007-DASHBOARD-PDF-EXPORT.md)

---

## RFC-008: AI Insights Service

### Mejoras Planificadas

**Phase 1 (v0.5.0):** Rule Engine con insights básicos  
**Phase 2 (v0.6.0):** Integración con LLMs (GPT-4/Claude)  
**Phase 3 (v0.7.0+):** Fine-tuning, feedback loop, predicciones  

🤖 **AI-Powered Insights:** Análisis automático de datos con contexto  
📊 **5 Tipos de Insights:** Summary, Warning, Suggestion, Trend, Anomaly  
💡 **Confidence Scoring:** Nivel de confianza por cada insight  
🔄 **Fallback Strategy:** Rule Engine como backup si falla LLM  

Ver detalles en: [`docs/design/RFC-008-AI-INSIGHTS-SERVICE.md`](design/RFC-008-AI-INSIGHTS-SERVICE.md)

---

## FEATURES FUTURAS (v1.0+)

### 🔗 Compartir Dashboard (Share Dashboard Links)

**Estado:** Propuesta  
**Prioridad:** Media  
**Esfuerzo Estimado:** 2-3 días  
**Versión Target:** v1.0.0

#### Contexto

Los usuarios necesitan compartir dashboards con stakeholders externos sin requerir que creen cuentas en SideBy. Actualmente no existe un mecanismo de compartir públicamente.

**User Story:**
> Como usuario, quiero generar un link público de mi dashboard para compartirlo con mi equipo o clientes externos, de forma que puedan ver los datos sin necesidad de login.

#### Solución Propuesta

**1. Generar Link Público con Token JWT**

- Endpoint: `POST /api/v1/datasets/:id/share`
- Generar un token JWT con payload:
  ```json
  {
    "datasetId": "65f...",
    "expiresAt": "2026-12-31T23:59:59Z",
    "permissions": ["read"],
    "filters": { "categorical": { "Region": ["Norte"] } }
  }
  ```
- Guardar share link en DB con metadata:
  ```typescript
  interface ShareLink {
    _id: ObjectId;
    datasetId: ObjectId;
    token: string;
    createdBy: ObjectId;
    createdAt: Date;
    expiresAt: Date;
    accessCount: number;
    lastAccessedAt?: Date;
    filters?: DashboardFilters;
    isActive: boolean;
  }
  ```

**2. Public Dashboard Route**

- Frontend: `/public/datasets/:token`
- No requiere autenticación
- Muestra dashboard en modo "read-only" (sin edición)
- Header indica "Vista Pública" con badge
- Footer: "Creado con SideBy" + logo

**3. Share Modal UI**

```typescript
<ShareDashboardModal>
  <Input value={shareUrl} readOnly />
  <CopyButton />
  
  <DatePicker label="Fecha de expiración" />
  
  <Checkbox label="Aplicar filtros actuales" />
  
  <Button onClick={generateShareLink}>
    Generar Link
  </Button>
</ShareDashboardModal>
```

**4. Opciones de Expiración**

- 1 día
- 7 días
- 30 días
- Sin expiración (solo para usuarios premium)

#### Seguridad

- **Rate Limiting:** Máximo 10 share links por dataset
- **Token Expiration:** Auto-revoke al expirar
- **Analytics:** Track access count y last accessed
- **Revocation:** Botón para desactivar link en cualquier momento
- **Watermark:** Opcional "Compartido por [User Name]" en footer

#### Implementación

**Backend:**
- `src/modules/share/domain/ShareLink.ts` (Entity)
- `src/modules/share/application/GenerateShareLinkUseCase.ts`
- `src/modules/share/infrastructure/ShareLinkRepository.ts`
- `src/modules/share/presentation/ShareController.ts`

**Frontend:**
- `src/features/dataset/components/dashboard/ShareDashboardModal.tsx`
- `src/pages/PublicDashboard.tsx` (nueva página sin auth)
- `src/features/dataset/hooks/useShareDashboard.ts`

#### Limitaciones MVP

- No soporta edición de filtros en vista pública (filtros fijos del momento de share)
- No incluye AI Insights en vista pública (solo KPIs y gráficos)
- No permite exportar PDF desde vista pública

#### Extensiones Futuras (v1.1+)

- **Password Protection:** Proteger link con contraseña
- **Email Sharing:** Enviar link directamente por email desde la app
- **Embed Code:** Generar iframe para embeber dashboard en sitios externos
- **Analytics Dashboard:** Ver quién accedió, cuándo, desde dónde (IP, country)

---

### 🔔 Configurar Alertas (Alerts & Notifications)

**Estado:** Propuesta  
**Prioridad:** Media  
**Esfuerzo Estimado:** 5-7 días  
**Versión Target:** v1.0.0

#### Contexto

Los usuarios necesitan ser notificados automáticamente cuando ciertos KPIs alcanzan umbrales críticos (ej: Revenue baja >20%, Churn sube >15%). Actualmente deben revisar el dashboard manualmente.

**User Story:**
> Como usuario, quiero configurar alertas para que me notifiquen por email cuando Revenue caiga más de 20% respecto al período anterior, para tomar acciones correctivas de inmediato.

#### Solución Propuesta

**1. Alert Configuration Entity**

```typescript
interface DatasetAlert {
  _id: ObjectId;
  datasetId: ObjectId;
  userId: ObjectId;
  
  name: string;  // "Alerta de Revenue Bajo"
  description?: string;
  
  conditions: {
    kpi: string;  // "revenue"
    operator: 'greater_than' | 'less_than' | 'equals' | 'change_percent_above' | 'change_percent_below';
    threshold: number;
    compareWith?: 'previous_period' | 'absolute_value';
  }[];
  
  notificationChannels: ('email' | 'in-app' | 'webhook')[];
  
  emailConfig?: {
    recipients: string[];
    subject: string;
    template: string;
  };
  
  webhookConfig?: {
    url: string;
    method: 'POST' | 'GET';
    headers?: Record<string, string>;
  };
  
  schedule: {
    frequency: 'real-time' | 'daily' | 'weekly' | 'monthly';
    time?: string;  // HH:mm format (para daily)
    dayOfWeek?: number;  // 0-6 (para weekly)
    dayOfMonth?: number;  // 1-31 (para monthly)
  };
  
  lastTriggeredAt?: Date;
  triggerCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**2. Alert Evaluation Cron Job**

- Ejecutar según schedule configurado
- Evaluar condiciones contra datos actuales
- Si se cumple condición → trigger notifications
- Implementar "cooldown period" (no retriggear si ya se disparó en últimas X horas)

```typescript
// alert-evaluation.job.ts
export async function evaluateAlerts(): Promise<void> {
  const activeAlerts = await alertRepository.findActive();
  
  for (const alert of activeAlerts) {
    const dataset = await datasetRepository.findById(alert.datasetId);
    const currentKPI = calculateKPI(dataset.data, alert.conditions[0].kpi);
    
    if (shouldTriggerAlert(currentKPI, alert.conditions)) {
      await notificationService.send(alert);
      await alertRepository.updateLastTriggered(alert._id);
    }
  }
}
```

**3. Frontend: Alert Configuration UI**

```typescript
<ConfigureAlertsModal>
  <Input label="Nombre de la alerta" />
  
  <Select label="KPI a monitorear">
    <option>Revenue</option>
    <option>Traffic</option>
    <option>ROI</option>
    <option>Churn Rate</option>
  </Select>
  
  <Select label="Condición">
    <option>Disminuye más de</option>
    <option>Aumenta más de</option>
    <option>Es mayor que</option>
    <option>Es menor que</option>
  </Select>
  
  <Input type="number" label="Umbral (%)" />
  
  <Checkbox label="Notificar por Email" />
  <Checkbox label="Notificar en App" />
  <Checkbox label="Webhook (avanzado)" />
  
  <Select label="Frecuencia de evaluación">
    <option>Diaria (9:00 AM)</option>
    <option>Semanal (Lunes 9:00 AM)</option>
    <option>Mensual (Día 1, 9:00 AM)</option>
  </Select>
  
  <Button>Crear Alerta</Button>
</ConfigureAlertsModal>
```

**4. In-App Notifications**

- Nueva sección en header: "🔔 Notificaciones" con badge de count
- Dropdown con lista de notificaciones recientes
- Formato:
  ```
  🚨 Revenue bajó 23% en Dataset "Q1 2024"
  Hace 2 horas • Ver Dashboard →
  ```

**5. Email Notifications**

- Template HTML profesional
- Subject: `[SideBy Alert] Revenue bajó 23% en Dataset "Q1 2024"`
- Body:
  - Nombre de la alerta
  - Condición que se cumplió
  - Valor actual vs esperado
  - Link directo al dashboard
  - Botón "Desactivar esta alerta"

#### Implementación

**Backend:**
- `src/modules/alerts/domain/DatasetAlert.ts`
- `src/modules/alerts/application/CreateAlertUseCase.ts`
- `src/modules/alerts/application/EvaluateAlertsUseCase.ts`
- `src/modules/alerts/infrastructure/AlertRepository.ts`
- `src/modules/alerts/jobs/alert-evaluation.job.ts`
- `src/modules/notifications/infrastructure/EmailService.ts` (usar Nodemailer/SendGrid)

**Frontend:**
- `src/features/dataset/components/dashboard/ConfigureAlertsModal.tsx`
- `src/features/alerts/components/AlertsList.tsx`
- `src/features/alerts/components/NotificationDropdown.tsx`
- `src/features/alerts/hooks/useAlerts.ts`

#### Seguridad & Performance

- **Rate Limiting:** Máximo 5 alertas activas por dataset (plan free), 20 (premium)
- **Cooldown Period:** No retriggear misma alerta si ya se disparó en últimas 6 horas
- **Email Limits:** Máximo 10 emails por día por usuario (evitar spam)
- **Webhook Timeout:** 5 segundos máximo (evitar bloqueos)

#### Limitaciones MVP

- Solo condiciones simples (un solo KPI por alerta)
- No soporta condiciones complejas (AND/OR múltiples KPIs)
- No incluye notificaciones SMS/Slack (solo email + in-app + webhook)
- No hay "snooze" de alertas

#### Extensiones Futuras (v1.1+)

- **Complex Conditions:** Multiple KPIs con AND/OR logic
- **AI-Powered Alerts:** Detectar anomalías automáticamente sin configuración manual
- **Slack Integration:** Enviar alertas a canales de Slack
- **Alert History:** Dashboard de historial de alertas disparadas
- **Alert Templates:** Plantillas pre-configuradas ("Revenue Drop", "Churn Spike")

---



## Convenciones

### Estados
- **Propuesta:** Mejora identificada, pendiente de diseño detallado
- **En Diseño:** RFC en creación, buscando feedback
- **Aprobada:** Diseño validado, lista para implementación
- **En Desarrollo:** Trabajo en progreso
- **Completada:** Mergeada a `main`

### Prioridad
- **Alta:** Blocking para siguiente release
- **Media:** Important but not urgent
- **Baja:** Nice to have

### Esfuerzo Estimado
- **XS:** < 1 día
- **S:** 1-3 días
- **M:** 3-5 días
- **L:** 1-2 semanas
- **XL:** > 2 semanas

---

**Última Actualización:** 2026-02-13  
**Mantenido por:** Engineering Team
