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

## RFC-005: TBD

### Mejoras Planificadas

_Pendiente: Futuras features_

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
