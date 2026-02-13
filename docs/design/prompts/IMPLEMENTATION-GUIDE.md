# 🚀 Guía de Implementación con Validación Automática

Este documento te guía paso a paso en la implementación de las 8 fases de React Query + RFC-004 con validación automática.

---

## 📋 Prerequisitos

Antes de empezar, asegúrate de tener:

- ✅ Node.js instalado
- ✅ Backend API corriendo (`cd solution-sideby/apps/api && npm run dev`)
- ✅ Cliente instalado (`cd solution-sideby/apps/client && npm install`)
- ✅ Git en una rama limpia

---

## 🎯 Workflow Fase por Fase

### Estructura del Workflow

```
1. Das el prompt al Agente Frontend
2. El agente implementa la fase
3. Ejecutas el script de validación
4. Si pasa ✅ → Siguiente fase
5. Si falla ❌ → Correges y vuelves a validar
```

---

## 📝 Instrucciones Detalladas

### 🔵 PHASE 1: QueryClient Setup

**1. Instrucción al Agente:**

```markdown
Lee docs/design/prompts/REACT-QUERY-START-HERE.md para contexto.

⚠️ Implementa SOLO la PHASE-1:
Lee y ejecuta: docs/design/prompts/PHASE-1-REACT-QUERY-SETUP.md

Criterios de éxito:
✅ QueryClient configurado
✅ App wrapped con QueryClientProvider
✅ DevTools visible
✅ Test utils creados
✅ Tests pasando

NO continúes con Phase-2. Detente y reporta cuando termines.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 1
```

**3. Si la validación pasa:**
```powershell
git add .
git commit -m "feat(query): setup QueryClient infrastructure (Phase-1)

- Created queryClient.ts with custom config
- Wrapped App with QueryClientProvider
- Added ReactQueryDevtools for development
- Created test utils for React Query
- All tests passing

Phase 1/8 complete ✅"
```

**💡 Tip:** Usa los templates de commit en [`COMMIT-TEMPLATES.md`](./COMMIT-TEMPLATES.md) para mensajes consistentes.

**4. Validación manual (opcional pero recomendada):**
```powershell
cd solution-sideby\apps\client
npm run dev
# Abre http://localhost:5173
# Verifica que en la esquina inferior izquierda aparezca el icono de React Query DevTools
```

---

### 🔵 PHASE 2: Migrate Queries

**1. Instrucción al Agente:**

```markdown
✅ Phase-1 completada y validada.

Implementa PHASE-2:
Lee y ejecuta: docs/design/prompts/PHASE-2-REACT-QUERY-QUERIES.md

Criterios de éxito:
✅ API service creado (datasets.api.ts)
✅ useDatasets migrado a useQuery
✅ useDataset migrado a useQuery
✅ Tests completos pasando
✅ Cache visible en DevTools

NO continúes con Phase-3. Detente y reporta.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 2
```

**3. Si pasa, commit:**
```powershell
git add .
git commit -m "feat(query): migrate queries to React Query (Phase-2)

- Created datasets.api.ts service layer
- Migrated useDatasets to useQuery
- Migrated useDataset to useQuery
- Implemented query key strategy
- All query tests passing
- Cache verified in DevTools

Phase 2/8 complete ✅"
```

**4. Validación manual:**
```powershell
# En DevTools, verifica que aparecen las queries:
# - ['datasets']
# - ['dataset', id]
# Navega entre páginas y observa que el cache funciona (datos instantáneos)
```

---

### 🔵 PHASE 3: Migrate Mutations

**1. Instrucción al Agente:**

```markdown
✅ Phase-2 completada y validada.

Implementa PHASE-3:
Lee y ejecuta: docs/design/prompts/PHASE-3-REACT-QUERY-MUTATIONS.md

Criterios de éxito:
✅ useUpdateDataset con optimistic updates
✅ useDeleteDataset con optimistic updates
✅ Cache invalidation automática
✅ Tests con rollback en errores pasando

NO continúes con Phase-4. Detente y reporta.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 3
```

**3. Si pasa, commit:**
```powershell
git add .
git commit -m "feat(query): implement mutations with optimistic updates (Phase-3)

- Created useUpdateDataset with onMutate/onError/onSuccess
- Created useDeleteDataset with optimistic removal
- Implemented cache invalidation strategy
- Added rollback on mutation errors
- All mutation tests passing

Phase 3/8 complete ✅"
```

---

### 🔵 PHASE 4: Update Components

**1. Instrucción al Agente:**

```markdown
✅ Phase-3 completada y validada.

Implementa PHASE-4:
Lee y ejecuta: docs/design/prompts/PHASE-4-REACT-QUERY-COMPONENTS.md

Criterios de éxito:
✅ DatasetsList actualizado con React Query hooks
✅ DatasetDashboard actualizado
✅ Código legacy eliminado
✅ Todos los tests pasando
✅ E2E manual funciona (lista → dashboard)

Detente y reporta. Este es el final de la migración a React Query.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 4
```

**3. Si pasa, commit:**
```powershell
git add .
git commit -m "feat(query): complete React Query migration (Phase-4)

- Updated DatasetsList to use React Query hooks
- Updated DatasetDashboard with queries
- Removed legacy useState/useEffect code
- All components tests passing
- E2E flow verified

REACT QUERY MIGRATION COMPLETE ✅
Phase 4/8 complete - Ready for RFC-004"
```

**4. ⚠️ CHECKPOINT CRÍTICO:**

Antes de continuar con RFC-004, verifica manualmente:

```powershell
cd solution-sideby\apps\client
npm test  # Todos deben pasar
npm run dev

# Flujo manual completo:
# 1. Lista carga desde API
# 2. Click en un dataset → Dashboard carga
# 3. Volver a lista → Datos instantáneos (cache)
# 4. Refrescar página → Datos persisten
# 5. DevTools muestra queries sin duplicados
```

**Si todo pasa → Continúa con Phase-5**

---

### 🟢 PHASE 5: DatasetsList Update (Empieza RFC-004)

**1. Instrucción al Agente:**

```markdown
🎉 React Query Migration completa y validada.

Ahora comienza RFC-004 Dashboard Template System.

Implementa PHASE-5:
Lee y ejecuta: docs/design/prompts/PHASE-5-DATASETS-LIST-UPDATE.md

Criterios de éxito:
✅ Feature flags configurados
✅ Botón Edit visible (con feature flag)
✅ Botón Dashboard siempre visible
✅ Navegación a /datasets/:id y /datasets/:id/dashboard
✅ Tests de feature flags pasando

Detente y reporta.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 5
```

**3. Si pasa:**
```powershell
git add .
git commit -m "feat(datasets): add Edit and Dashboard navigation (Phase-5)

- Implemented feature flag system
- Added Edit button (behind VITE_FEATURE_DATASET_EDIT_ENABLED)
- Added Dashboard button (always visible)
- Configured routes for detail and dashboard pages
- All navigation tests passing

RFC-004 Phase 5/8 complete ✅"
```

**4. Validación manual:**
```powershell
# Crear .env.local si no existe:
echo "VITE_FEATURE_DATASET_EDIT_ENABLED=true" > solution-sideby\apps\client\.env.local

npm run dev
# Verifica:
# - Botón "Editar" visible en cada card
# - Botón "Dashboard" visible
# - Edit button desaparece si cambias flag a false
```

---

### 🟢 PHASE 6: DatasetDetail Edit Page

**1. Instrucción al Agente:**

```markdown
✅ Phase-5 completada y validada.

Implementa PHASE-6:
Lee y ejecuta: docs/design/prompts/PHASE-6-DATASET-DETAIL.md

Criterios de éxito:
✅ React Hook Form + Zod instalados
✅ Schema de validación creado
✅ Formulario con 4 secciones implementado
✅ Color pickers funcionando
✅ Tests de validación pasando

Detente y reporta.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 6
```

**3. Si pasa:**
```powershell
git add .
git commit -m "feat(datasets): implement edit page with forms (Phase-6)

- Installed react-hook-form + zod
- Created datasetEdit.schema.ts with validation
- Implemented 4 form sections (General, Groups, KPIs, AI)
- Added color pickers for group customization
- All validation tests passing

RFC-004 Phase 6/8 complete ✅"
```

---

### 🟢 PHASE 7: Dashboard Templates

**1. Instrucción al Agente:**

```markdown
✅ Phase-6 completada y validada.

Implementa PHASE-7:
Lee y ejecuta: docs/design/prompts/PHASE-7-DASHBOARD-TEMPLATES.md

⚠️ Esta es la fase más compleja (8-10 horas).

Criterios de éxito:
✅ 3 templates definidos (Executive, Trends, Detailed)
✅ useDatasetDashboard hook con cálculo de KPIs
✅ Template selector implementado
✅ Filtros categóricos dinámicos
✅ KPI Grid con comparación A vs B
✅ Gráficos comparativos
✅ Tabla detallada con pagination

Detente y reporta.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 7
```

**3. Si pasa:**
```powershell
git add .
git commit -m "feat(dashboard): implement template system (Phase-7)

- Created 3 dashboard templates
- Implemented useDatasetDashboard hook with KPI calculations
- Added TemplateSelector component
- Implemented DashboardFiltersBar with categorical filters
- Created KPIGrid with A vs B comparison
- Added ComparisonChart and ComparisonTable
- All dashboard tests passing

RFC-004 Phase 7/8 complete ✅"
```

---

### 🟢 PHASE 8: Integration Tests E2E

**1. Instrucción al Agente:**

```markdown
✅ Phase-7 completada y validada.

Implementa PHASE-8 (FINAL):
Lee y ejecuta: docs/design/prompts/PHASE-8-INTEGRATION-TESTS.md

Criterios de éxito:
✅ MSW configurado
✅ Tests E2E del flujo completo pasando
✅ Tests de optimistic updates pasando
✅ Tests de cache invalidation pasando
✅ Coverage >= 80% en módulo datasets

Esta es la fase final. Detente y reporta.
```

**2. Validación:**

```powershell
.\validate-phase.ps1 -Phase 8
```

**3. Si pasa:**
```powershell
git add .
git commit -m "test(datasets): complete E2E test suite (Phase-8)

- Configured MSW for API mocking
- Implemented E2E tests for complete user flows
- Added tests for optimistic updates and rollback
- Verified cache invalidation after mutations
- All tests passing with coverage >= 80%

RFC-004 COMPLETE ✅
All 8 Phases Implemented Successfully 🎉

Ready for production deployment."
```

**4. Validación Final (Coverage):**

```powershell
cd solution-sideby\apps\client
npm run test:coverage -- features/dataset

# Verifica que todas las métricas >= 80%:
# - Statements: >= 80%
# - Branches: >= 75%
# - Functions: >= 80%
# - Lines: >= 80%
```

---

## 🎉 ¡Implementación Completa!

Si llegaste aquí, has completado exitosamente:

- ✅ React Query Migration (Phase 1-4)
- ✅ RFC-004 Dashboard Template System (Phase 5-8)
- ✅ 7 días de implementación
- ✅ 29-38 horas de trabajo
- ✅ Reducción de código del 37%
- ✅ Performance mejorada en 95%
- ✅ Coverage >= 80%

---

## 🚨 Troubleshooting

### El script de validación no se ejecuta

```powershell
# Habilitar ejecución de scripts (solo primera vez):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Tests fallan pero el script dice que pasan

```powershell
# Verifica manualmente:
cd solution-sideby\apps\client
npm test -- --verbose
```

### Feature flag no funciona

```powershell
# Asegúrate de reiniciar el dev server después de cambiar .env.local
# Ctrl+C y luego:
npm run dev
```

### Coverage bajo

```powershell
# Genera reporte HTML para ver archivos sin coverage:
npm run test:coverage -- --reporter=html
# Abre: coverage/index.html
```

---

## 📊 Métricas de Éxito

Al finalizar, deberías tener:

| Métrica | Objetivo | Cómo Verificar |
|---------|----------|----------------|
| Tests pasando | 100% | `npm test` → All green ✅ |
| Coverage | >= 80% | `npm run test:coverage` |
| Build exitoso | Sí | `npm run build` → No errors |
| TypeScript | 0 errores | `npm run type-check` |
| Performance | < 500ms | Chrome DevTools → Network |
| Templates | 3 | Executive, Trends, Detailed |
| Feature flags | Funcionales | Toggle en .env.local |

---

## ✅ Checklist Final

Antes de dar por terminado:

- [ ] Todas las fases validadas (1-8)
- [ ] Todos los tests pasan
- [ ] Coverage >= 80%
- [ ] Build sin errores
- [ ] Manual E2E test exitoso
- [ ] DevTools muestran queries correctamente
- [ ] Feature flags funcionan
- [ ] No hay console.errors en navegador
- [ ] Git commits limpios (8 commits, uno por fase)
- [ ] README actualizado (si es necesario)

---

**¡Felicitaciones! 🚀 Tu implementación está completa y lista para producción.**
