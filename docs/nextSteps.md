# Next Steps — SideBy

> Generado el: 2026-04-17  
> Basado en: revisión completa del codebase vs ROADMAP + RFCs + TODOs en código  
> Estado general: **MVP funcional**. Auth, upload CSV, wizard de mapping, dashboard con templates y filtros, edición de datasets, insights con AI — todo implementado.

---

## Leyenda de estados

| Símbolo | Significado |
|---------|-------------|
| ❌ | No implementado |
| ⚠️ | Parcialmente implementado o con limitación conocida |
| ✅ | Completado |
| 🔲 | Identificado pero fuera de scope actual |

---

## 1. Limpieza de Datasets Abandonados (RFC-002)

**Prioridad:** Baja · **Esfuerzo:** 1-2 días · **Target:** v0.4.0

El repositorio `MongoDatasetRepository` ya tiene `findAbandoned()` implementado, pero el cron job nunca se registra.

- [ ] Crear `src/modules/datasets/jobs/cleanup-abandoned.job.ts`
- [ ] Instalar dependencia `node-cron`
- [ ] Añadir vars de entorno: `CLEANUP_JOB_ENABLED`, `CLEANUP_JOB_SCHEDULE`, `ABANDONED_DATASET_HOURS` en `.env` y `.env.example`
- [ ] Registrar el scheduler en `src/index.ts` o `src/jobs/scheduler.ts`
- [ ] Tests unitarios del job
- [ ] Documentar en README de operaciones

**Referencia:** `docs/ROADMAP.md → RFC-002`

---

## 2. Toggle de Tipo de Columna (RFC-003)

**Prioridad:** Media · **Esfuerzo:** 3-5 días · **Target:** v0.3.0

El auto-clasificador detecta "Year" como métrica numérica, pero en práctica es una dimensión. No hay forma de que el usuario override el tipo detectado.

**Backend:**
- [ ] Extender `ColumnMapping` type con `originalType` y `typeOverride` en `wizard.types.ts`
- [ ] Agregar lógica de transformación en el pipeline de procesamiento de datos
- [ ] Tests unitarios para transformaciones de tipo

**Frontend:**
- [ ] UI: Agregar dropdown de tipo en `ColumnMappingStep.tsx`
- [ ] State: Actualizar `useWizardState` para manejar `typeOverride`
- [ ] Validation: Prevenir overrides inválidos (ej: text → numeric)
- [ ] Tests: Vitest + RTL para interacciones de toggle

**Integration:**
- [ ] Test end-to-end del flujo completo con override

**Referencia:** `docs/ROADMAP.md → RFC-003`, `client/src/features/dataset/utils/autoClassify.ts`

---

## 3. Auto-save de Template Preference (RFC-005)

**Prioridad:** Media · **Esfuerzo:** 1-2 días · **Target:** v0.6.0

El `DatasetDashboard` mantiene `selectedTemplate` en estado local — se pierde al recargar. El backend ya acepta `dashboardLayout.templateId` en el PATCH endpoint.

- [ ] Implementar auto-save con debounce (2s) al cambiar template en `DatasetDashboard.tsx`
- [ ] Visual feedback: "Guardando..." → "✓ Guardado"
- [ ] Error handling silencioso con logging (sin toast intrusivo)
- [ ] Tests con fake timers para validar debounce
- [ ] Integration test: cambiar template → recargar → validar persistencia

**Referencia:** `docs/ROADMAP.md → RFC-005`, `client/src/features/dataset/components/dashboard/TemplateSelector.tsx`

---

## 4. Export PDF del Dashboard (RFC-007)

**Prioridad:** Media · **Esfuerzo:** 3-5 días · **Target:** v0.7.0

El botón "Exportar PDF" ya existe en `DatasetDashboard.tsx` con un `TODO: RFC-007` pero la funcionalidad no está implementada.

```tsx
// DatasetDashboard.tsx línea ~dashboard
{/* TODO: RFC-007 - Export PDF Button */}
```

- [ ] Integrar librería de PDF (recomendado: `@react-pdf/renderer` o `html2canvas` + `jspdf`)
- [ ] Crear `PDFExportService` o hook `useExportPDF`
- [ ] Section selector: el usuario elige qué secciones exportar
- [ ] Layout A4 optimizado para impresión profesional
- [ ] Links funcionales al dashboard online en el PDF
- [ ] Tests del componente de export

**Referencia:** `docs/design/RFC-007-DASHBOARD-PDF-EXPORT.md`

---

## 5. Frontend Logger Utility (ROADMAP → Infrastructure)

**Prioridad:** Media · **Esfuerzo:** 1-2 días · **Target:** v0.5.0

No existe `src/shared/utils/logger.ts`. Hay `console.log`/`console.error` directos en producción y un TODO explícito en `auth.repository.ts`:

```ts
// TODO: Implement proper frontend logging solution
```

- [ ] Crear `src/shared/utils/logger.ts` con métodos `debug/info/warn/error`
- [ ] Lógica de entorno: `debug` e `info` solo en development/test, `warn` y `error` siempre
- [ ] Helpers de performance timing (`logger.time` / `logger.timeEnd`)
- [ ] Tests unitarios del logger
- [ ] Migrar `console.error` en `useUpdateDataset.ts` y demás hooks al logger
- [ ] Migrar TODO en `auth.repository.ts`

**Referencia:** `docs/ROADMAP.md → Infrastructure & Observability`

---

## 6. Sentry Integration (RFC-011)

**Prioridad:** Alta · **Esfuerzo:** 2-3 días · **Target:** v1.1.0  
**Dependencia:** Logger utility (#5 arriba) recomendada primero

No hay tracking de errores en producción ni en el frontend.

**Frontend:**
- [ ] Instalar `@sentry/react` + `@sentry/vite-plugin`
- [ ] Configurar `Sentry.init()` en `main.tsx`
- [ ] Integrar `ErrorBoundary` con `Sentry.ErrorBoundary`
- [ ] Añadir `VITE_SENTRY_DSN` y `VITE_SENTRY_ENVIRONMENT` a `.env`
- [ ] Configurar source maps solo para prod builds

**Backend:**
- [ ] Instalar `@sentry/node`
- [ ] Inicializar en `src/index.ts` antes de definir rutas
- [ ] Integrar con middleware global de errores existente
- [ ] Añadir `SENTRY_DSN` a variables de entorno del API

**Referencia:** `docs/design/RFC-011-ADD-SENTRY-TO-OBSERVABILITY.md`

---

## 7. Excel File Parsing (UC-CORE-01)

**Prioridad:** Media · **Esfuerzo:** 0.5-1 día

El wizard acepta Excel en la UI pero el parser no lo implementa:

```ts
// client/src/features/dataset/utils/csvParser.ts
// TODO: Implementar parsing de Excel real
```

- [ ] Integrar librería `xlsx` o `exceljs` para parsing de `.xlsx` / `.xls`
- [ ] Actualizar `csvParser.ts` con función `parseExcel()`
- [ ] Tests unitarios con archivos Excel de ejemplo
- [ ] Actualizar validación de archivos en `fileValidation.ts`

**Referencia:** `client/src/features/dataset/utils/csvParser.ts`

---

## 8. Token Validation y Refresh Endpoint (Auth)

**Prioridad:** Media · **Esfuerzo:** 1-2 días

Hay dos TODOs en `auth.repository.ts` que indican endpoints faltantes:

```ts
// TODO: Implementar endpoint de validación
// TODO: Implementar endpoint de refresh
```

- [ ] **Backend:** Implementar `GET /api/v1/auth/validate` (verifica JWT activo)
- [ ] **Backend:** Implementar `POST /api/v1/auth/refresh` (refresca token expirado)
- [ ] **Frontend:** Conectar `AuthRepository.validate()` y `AuthRepository.refresh()`
- [ ] Integrar refresh automático en el interceptor de Axios (`auth.repository.ts`)
- [ ] Tests de integración para ambos endpoints

---

## 9. Visualizaciones Avanzadas del Dashboard (RFC-006)

**Prioridad:** Media · **Esfuerzo:** L (1-2 semanas) · **Target:** v0.6.0

Ver `docs/design/RFC-006-DASHBOARD-VISUALIZATION-ENHANCEMENTS.md` para el diseño completo.

- [ ] **Date Umbrella System:** alinear fechas de períodos diferentes para comparación temporal (existe `dateUmbrella.ts` con lógica parcial)
- [ ] **Executive View:** KPI cards con sparklines + gráfico configurable principal
- [ ] **Trends View:** Grid 2×2 de mini-charts con trend indicators
- [ ] **Detailed View:** Tabla de totales + tabla granular con deltas + export CSV
- [ ] **KPIs con métrica inversa:** flag por KPI para métricas "menos es mejor" (costos, churn)

---

## 10. Compartir Dashboard — Share Links (v1.0+)

**Prioridad:** Media · **Esfuerzo:** 2-3 días · **Target:** v1.0.0

No existe ninguna funcionalidad de sharing. Ver diseño completo en ROADMAP.

- [ ] **Backend:** Módulo `share` con entidad `ShareLink`, `GenerateShareLinkUseCase`, `ShareLinkRepository`, `ShareController`
- [ ] **Backend:** Endpoint `POST /api/v1/datasets/:id/share` con JWT para links públicos
- [ ] **Frontend:** `ShareDashboardModal.tsx` con URL + copy button + expiration picker
- [ ] **Frontend:** Página `PublicDashboard.tsx` sin auth (`/public/datasets/:token`)
- [ ] Rate limiting: máx 10 share links por dataset
- [ ] Tests de seguridad: token expirado, token inválido, dataset privado

---

## 11. Alertas y Notificaciones (v1.0+)

**Prioridad:** Media · **Esfuerzo:** 5-7 días · **Target:** v1.0.0

No existe el módulo de alertas. Ver diseño completo en ROADMAP.

- [ ] **Backend:** Módulo `alerts` con entidad `DatasetAlert` y cron job de evaluación
- [ ] **Backend:** Servicio de email con Nodemailer o SendGrid
- [ ] **Frontend:** `ConfigureAlertsModal.tsx` y `NotificationDropdown.tsx` en header
- [ ] In-app notifications con badge de count
- [ ] Email templates profesionales

---

## 12. KPICard Test — Tipos con Recharts (deuda técnica)

**Prioridad:** Baja · **Esfuerzo:** < 1 día

```ts
// client/src/features/dataset/components/__tests__/KPICard.test.tsx
// TODO: Re-habilitar cuando se resuelva el problema de tipos con Recharts
```

- [ ] Investigar el error de tipos de Recharts en el test de `KPICard`
- [ ] Habilitar el test deshabilitado

---

## Resumen por Prioridad

### 🔴 Alta (bloquea producción o user experience crítico)
1. **Sentry Integration** (#6) — sin observabilidad en prod
2. **Token Refresh** (#8) — sesiones no se refrescan automáticamente

### 🟡 Media (mejora UX / DX significativa)
3. **Auto-save Template** (#3) — UX regression al recargar
4. **Excel Parsing** (#7) — feature prometida pero no implementada
5. **Frontend Logger** (#5) — prerequisito de Sentry
6. **Export PDF** (#4) — botón visible pero inoperativo
7. **Toggle Tipo Columna** (#2) — workaround doloroso para usuarios con datos de año

### 🟢 Baja / Futuro
8. **Cleanup Job** (#1) — nice to have, no crítico en MVP
9. **RFC-006 Visualizaciones** (#9) — mejora de dashboard
10. **Share Links** (#10) — v1.0
11. **Alertas** (#11) — v1.0
12. **KPICard test** (#12) — deuda técnica menor

---

**Última actualización:** 2026-04-17  
**Mantenido por:** Engineering Team
