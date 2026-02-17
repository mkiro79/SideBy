# RFC-009 - Refactor Step 3 del Wizard (Dataset SourceConfig)

## Estado
- En Progreso (Backend Completo, Frontend Pendiente)

## Contexto
El Step 3 del wizard de carga de datasets solo permite editar nombre y descripcion. Falta exponer en UI y persistir en el guardado final los valores de configuracion de grupos A y B (labels y colores). Esto es necesario para alinear la visualizacion del dashboard con las preferencias del usuario.

## Objetivo
Agregar en el Step 3 campos editables para:
- label de Grupo A y Grupo B
- color de Grupo A y Grupo B

Estos datos deben enviarse en el PATCH final junto con la configuracion existente.

## Alcance
- Frontend: UI, estado del wizard y payload de PATCH.
- Backend: validacion de esquema, DTOs y actualizacion de sourceConfig.
- Documentacion OpenAPI.

## No Alcance
- Cambios en Step 1 (upload) o Step 2 (mapping).
- Cambios en dashboard (RFC008).
- Cambio de templates o layout del dashboard.

## Requerimientos Funcionales
1. El Step 3 muestra los campos de Grupo A y Grupo B en una seccion visible al final de la pagina.
2. El usuario puede editar label y color de ambos grupos antes de guardar.
3. El PATCH final incluye sourceConfig con los valores editados.
4. Los colores por defecto se cargan desde tokens CSS:
   - Grupo A: data-primary
   - Grupo B: data-comparative

## Requerimientos No Funcionales
- Validacion de labels y colores en el backend (limites y formato hex).
- Compatibilidad con datasets existentes (sourceConfig opcional en PATCH).
- Accesibilidad: inputs con label y estados de foco.

## Contratos API (propuesta)
PATCH /api/v1/datasets/{id}

Request body (parcial):
{
  "meta": { "name": "...", "description": "..." },
  "schemaMapping": { ... },
  "dashboardLayout": { ... },
  "aiConfig": { ... },
  "sourceConfig": {
    "groupA": { "label": "...", "color": "#3b82f6" },
    "groupB": { "label": "...", "color": "#f97316" }
  }
}

## Criterios de Aceptacion
- El usuario puede modificar y guardar labels y colores de ambos grupos.
- El backend persiste los cambios en sourceConfig.
- Los defaults usan data-primary (A) y data-comparative (B).

## Plan de Pruebas
- Unit test BE: UpdateMappingUseCase actualiza sourceConfig sin perder originalFileName y rowCount.
- Unit test BE: validacion de label y color.
- Integracion FE: Step 3 edita labels/colores y el payload incluye sourceConfig.

## Riesgos
- Inconsistencias entre tokens CSS y colores por defecto del backend.
- Retrocompatibilidad con clientes que no envian sourceConfig.

## Tareas

### Backend ✅ (Completado 2026-02-16)
- [x] Extender `UpdateMappingSchema` en `datasets.schemas.ts` con validación de `sourceConfig` (groupA/groupB con label y color hex)
- [x] Actualizar `UpdateMappingInput` DTO en `dataset.dtos.ts` con campo opcional `sourceConfig`
- [x] Implementar lógica de merge en `UpdateMappingUseCase.ts` (preservar originalFileName y rowCount, actualizar label/color)
- [x] Agregar tests unitarios para validación de sourceConfig (label > 50 chars, color inválido, actualización exitosa)
- [x] Alinear DEFAULT_COLOR_GROUP_B con token CSS `data-comparative` (#6366f1) en `validation.rules.ts`
- [x] Actualizar documentación Swagger en `datasets.swagger.ts` para endpoint PATCH

### Frontend ⏳ (Pendiente)
- [ ] Crear/actualizar UI en `ConfigurationStep.tsx` con inputs para label y color de Grupo A/B
- [ ] Extender estado del wizard en `useWizardState.ts` con defaults desde tokens CSS
- [ ] Actualizar `DataUploadWizard.tsx` para incluir `sourceConfig` en payload del PATCH
- [ ] Agregar tests de integración para flujo completo del wizard con sourceConfig

## Dependencias
- DatasetRules (limites y validacion).
- Tokens CSS del cliente (data-primary, data-comparative).
