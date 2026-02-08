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

_Pendiente: Agregar mejoras identificadas para ingesta de datos_

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

## RFC-004: TBD

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

**Última Actualización:** 2026-02-08  
**Mantenido por:** Engineering Team
