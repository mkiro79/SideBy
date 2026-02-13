# 🚀 Complete Implementation Guide - React Query + RFC-004

Este es el punto de entrada rápido para la implementación completa del sistema de datasets con React Query y Dashboard Templates.

---

## ⚡ Start Here

### 🎯 Opción 1: Implementación Guiada con Validación Automática (RECOMENDADO)

**👉 [IMPLEMENTATION-GUIDE.md](IMPLEMENTATION-GUIDE.md)** ⭐⭐⭐

Sigue la guía paso a paso con script de validación automática entre fases.

**Script de validación incluido:** `validate-phase.ps1`

### 🎯 Opción 2: Implementación Manual

**👉 [PHASE-1-REACT-QUERY-SETUP.md](PHASE-1-REACT-QUERY-SETUP.md)** ⭐

Comienza con el setup básico de React Query (Día 1 - Mañana, 2-3 horas)

---

## 📋 Roadmap Completo (8 Fases)

### 🔵 Part 1: React Query Migration (Days 1-2)

#### ✅ PHASE 1: Setup Foundation
**Archivo:** [PHASE-1-REACT-QUERY-SETUP.md](PHASE-1-REACT-QUERY-SETUP.md)  
**Duración:** 2-3 horas (Día 1 - AM)  
**Tareas:**
- Instalar dependencias (`@tanstack/react-query` + devtools)
- Crear `queryClient.ts` configuration
- Wrappear App con `QueryClientProvider`
- Crear test utils (`createTestQueryClient`)
- Verificar con test básico

**Resultado:** Infraestructura de React Query lista para usar

---

#### ✅ PHASE 2: Migrate Queries
**Archivo:** [PHASE-2-REACT-QUERY-QUERIES.md](PHASE-2-REACT-QUERY-QUERIES.md)  
**Duración:** 3-4 horas (Día 1 - PM)  
**Tareas:**
- Crear API service (`datasets.api.ts`)
- Migrar `useDatasets` de useState → useQuery
- Migrar `useDataset` de useState → useQuery
- Crear tests completos para ambos hooks
- Verificar cache en DevTools

**Resultado:** Hooks de lectura migrados, cache funcionando

---

#### ✅ PHASE 3: Migrate Mutations
**Archivo:** [PHASE-3-REACT-QUERY-MUTATIONS.md](PHASE-3-REACT-QUERY-MUTATIONS.md)  
**Duración:** 4-5 horas (Día 2 - AM)  
**Tareas:**
- Crear `useUpdateDataset` con optimistic updates
- Crear `useDeleteDataset` con cache removal
- Implementar invalidación automática
- Tests de mutations con rollback

**Resultado:** CRUD completo con React Query

---

#### ✅ PHASE 4: Update Components
**Archivo:** [PHASE-4-REACT-QUERY-COMPONENTS.md](PHASE-4-REACT-QUERY-COMPONENTS.md)  
**Duración:** 2-3 horas (Día 2 - PM)  
**Tareas:**
- Actualizar `DatasetsList` para usar los nuevos hooks
- Actualizar `DatasetDashboard`
- Remover código legacy (useState/useEffect manuales)
- Verificar que todo funciona end-to-end

**Resultado:** ✅ React Query Migration COMPLETE

---

### 🟢 Part 2: RFC-004 Dashboard Template System (Days 3-7)

#### ✅ PHASE 5: DatasetsList Update
**Archivo:** [PHASE-5-DATASETS-LIST-UPDATE.md](PHASE-5-DATASETS-LIST-UPDATE.md)  
**Duración:** 3-4 horas (Día 3)  
**Tareas:**
- Configurar feature flags (`VITE_FEATURE_DATASET_EDIT_ENABLED`)
- Agregar botones Edit y Dashboard en DatasetCard
- Implementar navegación a `/datasets/:id` y `/datasets/:id/dashboard`
- Tests de feature flags

**Resultado:** Navegación completa entre páginas

---

#### ✅ PHASE 6: DatasetDetail Edit Page
**Archivo:** [PHASE-6-DATASET-DETAIL.md](PHASE-6-DATASET-DETAIL.md)  
**Duración:** 5-6 horas (Día 4-5)  
**Tareas:**
- Instalar React Hook Form + Zod
- Crear schema de validación
- Implementar formulario con 4 secciones:
  - General Info (nombre, descripción)
  - Group Configuration (labels, colores)
  - KPI Fields (tabla editable)
  - AI Configuration (toggle, context)
- Tests de validación y submit

**Resultado:** Página de edición completa con validación

---

#### ✅ PHASE 7: Dashboard Templates
**Archivo:** [PHASE-7-DASHBOARD-TEMPLATES.md](PHASE-7-DASHBOARD-TEMPLATES.md)  
**Duración:** 8-10 horas (Día 6-7)  
**Tareas:**
- Definir tipos de templates (Executive, Trends, Detailed)
- Crear hook `useDatasetDashboard` (cálculo de KPIs)
- Implementar TemplateSelector
- Crear DashboardFiltersBar (filtros categóricos)
- Crear KPIGrid (tarjetas de KPIs con comparación A vs B)
- Crear ComparisonChart (gráficos de barras)
- Crear ComparisonTable (tabla detallada con pagination)
- Tests de cálculos y filtros

**Resultado:** Dashboard completo con 3 templates

---

#### ✅ PHASE 8: Integration Tests E2E
**Archivo:** [PHASE-8-INTEGRATION-TESTS.md](PHASE-8-INTEGRATION-TESTS.md)  
**Duración:** 2-3 horas (Día 8)  
**Tareas:**
- Configurar MSW (Mock Service Worker)
- Test E2E del flujo completo (Lista → Edit → Dashboard)
- Test de optimistic updates y rollback
- Test de cache invalidation
- Test de feature flags
- Test de dashboard con filtros
- Validar coverage >= 80%

**Resultado:** ✅ RFC-004 COMPLETE & Production Ready

---

## 🎯 Objetivo General

### React Query Migration (Phase 1-4)

**Antes de la migración:**
```typescript
// ~25 líneas de boilerplate por hook
const [datasets, setDatasets] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchDatasets()
    .then(setDatasets)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);
```

**Después de la migración:**
```typescript
// ~5 líneas, con cache automático
const { data: datasets, isLoading, error } = useQuery({
  queryKey: ['datasets'],
  queryFn: listDatasets,
});
```

**Beneficios:**
- ✅ 37% menos código (~800 líneas → ~500 líneas)
- ✅ 95% más rápido en navegación repetida (cache)
- ✅ Cero requests duplicados
- ✅ Optimistic updates
- ✅ Invalidación inteligente
- ✅ DevTools para debugging

### RFC-004 Dashboard Templates (Phase 5-8)

**Nuevas Features:**
- ✅ 3 templates de dashboard (Executive, Trends, Detailed)
- ✅ Filtros categóricos dinámicos
- ✅ Cálculo automático de KPIs (A vs B)
- ✅ Gráficos comparativos
- ✅ Tabla detallada con pagination
- ✅ Edit page con React Hook Form + Zod
- ✅ Feature flags para control de features

---

## 📚 Referencias

### React Query
- **RFC Completo:** [RFC-React-Query-Migration.md](../RFC-React-Query-Migration.md)
- **Docs Oficiales:** https://tanstack.com/query/latest/docs/react/overview
- **Best Practices:** https://tkdodo.eu/blog/practical-react-query

### RFC-004
- **RFC Completo:** [RFC-004-DASHBOARD-TEMPLATE.md](../RFC-004-DASHBOARD-TEMPLATE.md)
- **React Hook Form:** https://react-hook-form.com
- **Zod Validation:** https://zod.dev

---

## ⏱️ Timeline Estimado

| Día | Fase | Focus | Horas | Status |
|-----|------|-------|-------|--------|
| **1** | 1 | QueryClient Setup | 2-3h | ✅ Documented |
| **1** | 2 | Migrate Queries | 3-4h | ✅ Documented |
| **2** | 3 | Migrate Mutations | 4-5h | ✅ Documented |
| **2** | 4 | Update Components | 2-3h | ✅ Documented |
| **3** | 5 | DatasetsList Update | 3-4h | ✅ Documented |
| **4-5** | 6 | DatasetDetail Edit | 5-6h | ✅ Documented |
| **6-7** | 7 | Dashboard Templates | 8-10h | ✅ Documented |
| **8** | 8 | E2E Tests | 2-3h | ✅ Documented |

**Part 1 Total (React Query):** 11-15 horas (2 días)  
**Part 2 Total (RFC-004):** 18-23 horas (5 días)  
**Grand Total:** 29-38 horas (7 días)

---

## ✅ Checklist de Progreso Completo

### Part 1: React Query Migration
- [ ] PHASE-1: Setup completado
- [ ] PHASE-2: Queries migradas
- [ ] PHASE-3: Mutations migradas
- [ ] PHASE-4: Components actualizados
- [ ] Todos los tests pasan
- [ ] Cache verificado en DevTools
- [ ] Performance mejorada

### Part 2: RFC-004 Implementation
- [ ] PHASE-5: Navegación Edit/Dashboard
- [ ] PHASE-6: Edit page con formulario
- [ ] PHASE-7: Dashboard templates
- [ ] PHASE-8: E2E tests
- [ ] Feature flags funcionando
- [ ] Coverage >= 80%
- [ ] Validación manual completa

---

## 🚀 ¡Empieza Ahora!

### 🎯 Flujo Recomendado

1. **Lee la guía de implementación completa:**  
   **[IMPLEMENTATION-GUIDE.md](IMPLEMENTATION-GUIDE.md)** ⭐

2. **Primer prompt al agente:**
   ```markdown
   Lee docs/design/prompts/REACT-QUERY-START-HERE.md para contexto.
   
   ⚠️ Implementa SOLO la PHASE-1:
   Lee y ejecuta: docs/design/prompts/PHASE-1-REACT-QUERY-SETUP.md
   
   NO continúes con Phase-2. Detente y reporta cuando termines.
   ```

3. **Valida antes de continuar:**
   ```powershell
   .\validate-phase.ps1 -Phase 1
   ```

4. **Si pasa ✅ → Siguiente fase**  
   **Si falla ❌ → Corrige y vuelve a validar**

5. **Repite para las 8 fases**

### 🧪 Validación Automática

El script `validate-phase.ps1` verifica automáticamente:
- ✅ Archivos creados
- ✅ Dependencias instaladas
- ✅ Tests pasando
- ✅ Código legacy eliminado
- ✅ Coverage mínimo

**Usa el script después de cada fase para asegurar calidad.**

---

**Nota:** Las fases son secuenciales. Cada una depende de la anterior.

---

## 📊 Métricas de Éxito

Al finalizar las 8 fases, deberías alcanzar:

| Métrica | Objetivo | Método de Medición |
|---------|----------|-------------------|
| Reducción de código | -30% | LOC comparison |
| Performance (navegación) | < 500ms | Chrome DevTools |
| Tests coverage | >= 80% | `npm run test:coverage` |
| Requests duplicados | 0 | React Query DevTools |
| Optimistic updates | Sí | Manual testing |
| Feature flags | Sí | Verificar visibilidad condicional |
| Template system | 3+ | Executive/Trends/Detailed |

---

**Actualizado:** 2026-02-13  
**Status:** ✅ All 8 phases documented and ready for implementation
