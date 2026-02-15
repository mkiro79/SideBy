# [RFC-005] Dashboard UX Improvements - Multi-Select Filters & Template Selector Enhancement

| Metadatos | Detalles |
| :--- | :--- |
| **Fecha / Date** | 2026-02-15 |
| **Estado / Status** | **Propuesto / Proposed** |
| **Prioridad / Priority** | Alta |
| **Esfuerzo / Effort** | 3 días |
| **Alcance / Scope** | `apps/client/src/features/dataset/components/dashboard` |
| **Dependencias** | RFC-004 (Dashboard Template System) |
| **Versión Target** | v0.5.0 |
| **Autor / Author** | Engineering Team |

---

## 1. Contexto y Motivación / Context & Motivation

### Problema Actual / Current Problem

El sistema de filtros y selector de templates actual tiene limitaciones UX importantes:

❌ **Filtros actuales:**
- Solo permiten seleccionar **un valor** por dimensión (ej: solo "Norte" O "Sur")
- No se pueden combinar múltiples valores (ej: "Norte" Y "Sur" Y "Este")
- No hay indicadores visuales de filtros activos (chips/badges)
- Falta botón de "Limpiar filtros" rápido

❌ **Template Selector actual:**
- Formato simple sin iconos descriptivos
- No muestra preview/descripción del template
- No guarda la preferencia del usuario
- No sincroniza con `dataset.dashboardLayout.templateId`

### Objetivos del RFC-005 / Goals

Este RFC implementa mejoras incrementales de UX **sin tocar la lógica de visualización** (eso es RFC-006):

1. **Multi-Select Filters:** Permitir seleccionar múltiples valores por dimensión
2. **Active Filters UI:** Chips removibles + botón "Limpiar todo"
3. **Template Selector Enhancement:** Iconos + descripciones + autoguardado con debounce
4. **Better Visual Feedback:** Loading states, tooltips, empty states

---

## 2. Arquitectura de la Solución / Solution Architecture

### 2.1 Multi-Select Filters Architecture

**Estado Actual (Single-Select):**
```typescript
// Estado actual en useDatasetDashboard
const [filters, setFilters] = useState<DashboardFilters>({
  categorical: {
    'Region': 'Norte',      // ⚠️ Solo un valor
    'Channel': 'Online',    // ⚠️ Solo un valor
  }
});
```

**Estado Nuevo (Multi-Select):**
```typescript
// Nuevo estado con arrays
interface DashboardFilters {
  categorical: Record<string, string[]>;  // ✅ Array de valores
}

const [filters, setFilters] = useState<DashboardFilters>({
  categorical: {
    'Region': ['Norte', 'Sur', 'Este'],  // ✅ Múltiples valores
    'Channel': ['Online', 'Retail'],     // ✅ Múltiples valores
  }
});
```

**Lógica de Filtrado Actualizada:**
```typescript
// solution-sideby/apps/client/src/features/dataset/hooks/useDatasetDashboard.ts

const applyFilters = (data: DataRow[], filters: DashboardFilters): DataRow[] => {
  return data.filter((row) => {
    // Para cada dimensión filtrada
    return Object.entries(filters.categorical).every(([field, selectedValues]) => {
      // Si no hay valores seleccionados, incluir todo
      if (!selectedValues || selectedValues.length === 0) return true;
      
      // Si el campo tiene valor, verificar si está en los valores seleccionados
      const rowValue = String(row[field] ?? '');
      return selectedValues.includes(rowValue);
    });
  });
};
```

---

### 2.2 UI Components Architecture

#### 2.2.1 Enhanced DashboardFiltersBar

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/DashboardFiltersBar.tsx`

```typescript
/**
 * DashboardFiltersBar - Multi-select filters con chips activos
 * 
 * Features:
 * - Multi-select dropdown por dimensión
 * - Chips removibles de filtros activos
 * - Botón "Limpiar todos los filtros"
 * - Contador de filtros activos
 */

import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card.js';
import { Button } from '@/shared/components/ui/button.js';
import { Badge } from '@/shared/components/ui/badge.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import { Checkbox } from '@/shared/components/ui/checkbox.js';
import type { Dataset } from '../../types/api.types.js';

interface DashboardFiltersBarProps {
  categoricalFields: string[];
  filters: Record<string, string[]>;  // ✅ Multi-select
  onFilterChange: (field: string, values: string[]) => void;
  onClearFilters: () => void;
  dataset: Dataset;
}

export const DashboardFiltersBar: React.FC<DashboardFiltersBarProps> = ({
  categoricalFields,
  filters,
  onFilterChange,
  onClearFilters,
  dataset,
}) => {
  // ... (Ver implementación completa en Phase 1)
  
  const activeFiltersCount = Object.values(filters).reduce(
    (acc, values) => acc + values.length, 
    0
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header con contador y botón limpiar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} activos</Badge>
              )}
            </div>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Multi-select dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {categoricalFields.slice(0, 4).map((field) => (
              <MultiSelectDropdown
                key={field}
                field={field}
                selectedValues={filters[field] || []}
                availableValues={getUniqueValues(dataset, field)}
                onValuesChange={(values) => onFilterChange(field, values)}
              />
            ))}
          </div>

          {/* Active filters chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {Object.entries(filters).map(([field, values]) =>
                values.map((value) => (
                  <Badge
                    key={`${field}-${value}`}
                    variant="default"
                    className="gap-1 pr-1"
                  >
                    <span className="text-xs">{field}: {value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        const newValues = values.filter((v) => v !== value);
                        onFilterChange(field, newValues);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MultiSelectDropdown Component
// ============================================================================

interface MultiSelectDropdownProps {
  field: string;
  selectedValues: string[];
  availableValues: string[];
  onValuesChange: (values: string[]) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  field,
  selectedValues,
  availableValues,
  onValuesChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const selectAll = () => {
    onValuesChange(availableValues);
  };

  const clearAll = () => {
    onValuesChange([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-8 border-dashed">
          {field}
          {selectedValues.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedValues.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${field}...`} />
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup>
            <CommandItem onSelect={selectAll}>
              <span className="font-medium">Seleccionar todo</span>
            </CommandItem>
            <CommandItem onSelect={clearAll}>
              <span className="font-medium">Limpiar</span>
            </CommandItem>
            <CommandSeparator />
            {availableValues.map((value) => (
              <CommandItem
                key={value}
                onSelect={() => toggleValue(value)}
              >
                <Checkbox
                  checked={selectedValues.includes(value)}
                  className="mr-2"
                />
                <span>{value}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
```

---

#### 2.2.2 Enhanced TemplateSelector

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/TemplateSelector.tsx`

```typescript
/**
 * TemplateSelector - Enhanced con iconos, descripciones y autoguardado
 * 
 * Features:
 * - Iconos descriptivos por template
 * - Preview de funcionalidad
 * - Autoguardado con debounce (2 segundos)
 * - Visual feedback de cambio
 */

import React from 'react';
import { FileText, TrendingUp, Table2, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import { useUpdateDataset } from '../../hooks/useUpdateDataset.js';
import type { DashboardTemplateId } from '../../types/dashboard.types.js';
import { DASHBOARD_TEMPLATES } from '../../types/dashboard.types.js';

interface TemplateSelectorProps {
  datasetId: string;
  selectedTemplate: DashboardTemplateId;
  savedTemplate: DashboardTemplateId;  // ✅ Del dataset.dashboardLayout.templateId
  onSelectTemplate: (template: DashboardTemplateId) => void;
}

const TEMPLATE_ICONS = {
  sideby_executive: FileText,
  sideby_trends: TrendingUp,
  sideby_detailed: Table2,
} as const;

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  datasetId,
  selectedTemplate,
  savedTemplate,
  onSelectTemplate,
}) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const { mutate: updateDataset } = useUpdateDataset();

  // ✅ Debounced auto-save (2 segundos después del cambio)
  React.useEffect(() => {
    if (selectedTemplate === savedTemplate) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      updateDataset(
        {
          datasetId,
          payload: {
            dashboardLayout: { templateId: selectedTemplate },
          },
        },
        {
          onSuccess: () => {
            setIsSaving(false);
          },
          onError: () => {
            setIsSaving(false);
          },
        }
      );
    }, 2000); // 2 segundos de debounce

    return () => clearTimeout(timer);
  }, [selectedTemplate, savedTemplate, datasetId, updateDataset]);

  const handleChange = (value: DashboardTemplateId) => {
    onSelectTemplate(value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Vista:</span>
      
      <Select value={selectedTemplate} onValueChange={handleChange}>
        <SelectTrigger className="w-[260px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(DASHBOARD_TEMPLATES).map((template) => {
            const Icon = TEMPLATE_ICONS[template.id];
            return (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-start gap-3 py-1">
                  {Icon && <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Visual feedback de guardado */}
      {isSaving && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Guardando...</span>
        </div>
      )}
      {!isSaving && selectedTemplate !== savedTemplate && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>No guardado</span>
        </div>
      )}
    </div>
  );
};
```

---

### 2.3 Backend Considerations

**¿Requiere cambios en backend?** 

✅ **NO** - El backend ya soporta:
- `dataset.dashboardLayout.templateId` (PATCH endpoint)
- Filtrado se hace en frontend (datos ya están en el dataset)

---

## 3. Implementación / Implementation

### Phase 1: Multi-Select Filters (1.5 días)

**Tasks:**

- [ ] **Types:**
  - [ ] Actualizar `DashboardFilters` interface para soportar arrays
  - [ ] Actualizar `DashboardFiltersBarProps` con nuevas props
  
- [ ] **Logic (Hook):**
  - [ ] Refactorizar `applyFilters` en `useDatasetDashboard.ts` para multi-select
  - [ ] Agregar `clearAllFilters` handler
  - [ ] Tests unitarios de lógica de filtrado

- [ ] **UI Components:**
  - [ ] Crear `MultiSelectDropdown` component (Popover + Checkbox)
  - [ ] Actualizar `DashboardFiltersBar` con multi-select
  - [ ] Agregar Active Filters Chips
  - [ ] Agregar botón "Limpiar filtros"
  - [ ] Tests de interacción con RTL

---

### Phase 2: Enhanced Template Selector (1 día)

**Tasks:**

- [ ] **Hook for Auto-Save:**
  - [ ] Crear `useUpdateDataset` mutation hook (si no existe)
  - [ ] Implementar debounce logic (2 segundos)
  - [ ] Tests de auto-save con fake timers

- [ ] **UI Enhancement:**
  - [ ] Agregar iconos a cada template
  - [ ] Agregar descripciones detalladas
  - [ ] Agregar loading indicator "Guardando..."
  - [ ] Agregar "No guardado" visual feedback
  - [ ] Tests de visual feedback

---

### Phase 3: Integration & Polish (0.5 días)

**Tasks:**

- [ ] **Integration:**
  - [ ] Conectar `TemplateSelector` con `useUpdateDataset`
  - [ ] Asegurar que filtros multi-select afecten KPIs, gráficos y tabla
  - [ ] Validar que el autoguardado se sincroniza correctamente

- [ ] **UX Polish:**
  - [ ] Loading skeletons para filtros mientras carga dataset
  - [ ] Empty state si no hay dimensiones categóricas
  - [ ] Tooltips explicativos
  - [ ] Responsive design (mobile)

- [ ] **Testing:**
  - [ ] E2E test: Aplicar multi-filtros → Validar datos filtrados en tabla
  - [ ] E2E test: Cambiar template → Validar autoguardado → Recargar página → Validar persistencia

---

## 4. User Stories

### US-1: Multi-Select Filters

```gherkin
Given un usuario está en el Dashboard de un dataset
When hace click en el filtro "Region"
And selecciona "Norte", "Sur" y "Este"
Then la tabla muestra datos que cumplen con CUALQUIERA de esas regiones (OR logic)
And aparecen 3 chips: "Region: Norte", "Region: Sur", "Region: Este"
```

### US-2: Clear Filters

```gherkin
Given un usuario tiene 5 filtros activos
When hace click en "Limpiar filtros"
Then todos los chips desaparecen
And la tabla muestra todos los datos sin filtrar
```

### US-3: Template Auto-Save

```gherkin
Given un usuario está en "Resumen Ejecutivo"
When cambia a "Análisis de Tendencias"
And espera 2 segundos
Then aparece el mensaje "Guardando..."
And después de 1 segundo aparece "✓ Guardado"
When recarga la página
Then el dashboard se abre en "Análisis de Tendencias"
```

---

## 5. Diseño Visual / Visual Design

### Mockup de Filtros Multi-Select

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Filtros                                  [2 activos]    ┃
┃  ┌─────────────────────────────────────────────────────┐ ┃
┃  │ [Region ▼ 3]  [Channel ▼ 2]  [Product ▼]           │ ┃
┃  │                             [Limpiar filtros ⟲]     │ ┃
┃  └─────────────────────────────────────────────────────┘ ┃
┃                                                           ┃
┃  Filtros activos:                                        ┃
┃  [Region: Norte ✕] [Region: Sur ✕] [Region: Este ✕]    ┃
┃  [Channel: Online ✕] [Channel: Retail ✕]                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Mockup de Template Selector Enhanced

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Vista: [▼ Análisis de Tendencias]  [⟳ Guardando...]   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Dropdown abierto:
┌─────────────────────────────────────────────┐
│ ✓ 📊 Resumen Ejecutivo                      │
│     Vista de alto nivel con KPIs clave      │
├─────────────────────────────────────────────┤
│   📈 Análisis de Tendencias                 │  <- SELECTED
│     Gráficos temporales de evolución        │
├─────────────────────────────────────────────┤
│   🔢 Tabla Detallada                        │
│     Exploración granular de datos raw        │
└─────────────────────────────────────────────┘
```

---

## 6. Testing Strategy

### Unit Tests

```typescript
// solution-sideby/apps/client/src/features/dataset/hooks/__tests__/useDatasetDashboard.test.ts

describe('Multi-Select Filters', () => {
  it('should filter data with multiple values in same dimension', () => {
    const data = [
      { Region: 'Norte', Revenue: 100 },
      { Region: 'Sur', Revenue: 200 },
      { Region: 'Este', Revenue: 300 },
    ];
    
    const filters = {
      categorical: {
        Region: ['Norte', 'Sur'],  // Multi-select
      },
    };
    
    const result = applyFilters(data, filters);
    
    expect(result).toHaveLength(2);
    expect(result[0].Region).toBe('Norte');
    expect(result[1].Region).toBe('Sur');
  });
  
  it('should return all data when filter array is empty', () => {
    const data = [
      { Region: 'Norte', Revenue: 100 },
      { Region: 'Sur', Revenue: 200 },
    ];
    
    const filters = {
      categorical: {
        Region: [],  // Empty = no filter
      },
    };
    
    const result = applyFilters(data, filters);
    
    expect(result).toHaveLength(2);
  });
});
```

### Integration Tests

```typescript
// solution-sideby/apps/client/src/features/dataset/components/dashboard/__tests__/DashboardFiltersBar.test.tsx

describe('DashboardFiltersBar', () => {
  it('should allow multi-selecting values and display chips', async () => {
    const onFilterChange = vi.fn();
    
    render(
      <DashboardFiltersBar
        categoricalFields={['Region']}
        filters={{}}
        onFilterChange={onFilterChange}
        onClearFilters={vi.fn()}
        dataset={mockDataset}
      />
    );
    
    // Open dropdown
    const regionButton = screen.getByRole('button', { name: /Region/i });
    await userEvent.click(regionButton);
    
    // Select "Norte"
    const norteCheckbox = screen.getByRole('checkbox', { name: /Norte/i });
    await userEvent.click(norteCheckbox);
    
    expect(onFilterChange).toHaveBeenCalledWith('Region', ['Norte']);
    
    // Select "Sur"
    const surCheckbox = screen.getByRole('checkbox', { name: /Sur/i });
    await userEvent.click(surCheckbox);
    
    expect(onFilterChange).toHaveBeenCalledWith('Region', ['Norte', 'Sur']);
  });
  
  it('should remove chip when clicking X button', async () => {
    const onFilterChange = vi.fn();
    
    render(
      <DashboardFiltersBar
        categoricalFields={['Region']}
        filters={{ Region: ['Norte', 'Sur'] }}
        onFilterChange={onFilterChange}
        onClearFilters={vi.fn()}
        dataset={mockDataset}
      />
    );
    
    // Find chip and click X
    const norteChip = screen.getByText('Region: Norte').parentElement!;
    const removeButton = within(norteChip).getByRole('button');
    await userEvent.click(removeButton);
    
    expect(onFilterChange).toHaveBeenCalledWith('Region', ['Sur']);
  });
});
```

---

## 7. Performance Considerations

### Optimizations

1. **Debounced Auto-Save:** 
   - Evita requests innecesarios al cambiar rápido entre templates
   - Timer de 2 segundos configurable

2. **Memoization:**
   ```typescript
   const uniqueValues = React.useMemo(
     () => getUniqueValues(dataset, field),
     [dataset, field]
   );
   ```

3. **Lazy Rendering:**
   - Filtros se renderizan solo si hay dimensiones categóricas
   - Chips se renderizan solo si hay filtros activos

---

## 8. Accessibility (a11y)

- [ ] Keyboard navigation en multi-select dropdown
- [ ] Screen reader announcements para filtros aplicados
- [ ] Focus management al abrir/cerrar dropdowns
- [ ] ARIA labels en chips removibles
- [ ] Color contrast en badges (WCAG AA)

---

## 9. Rollout Plan

### Stage 1: Feature Flag (opcional)
```typescript
FEATURES.MULTI_SELECT_FILTERS = import.meta.env.VITE_FEATURE_MULTI_SELECT_FILTERS === "true"
```

### Stage 2: Gradual Release
1. QA testing interno (2 días)
2. Beta con usuarios selectos (opcional)
3. Release a producción

### Stage 3: Monitoring
- Track: Número promedio de filtros aplicados por sesión
- Track: Tasa de uso de "Limpiar filtros"
- Track: Tasa de cambio de templates

---

## 10. Future Enhancements (Post-v0.5.0)

- [ ] **Saved Filter Presets:** Guardar combinaciones de filtros favoritas
- [ ] **Filter by Date Range:** Si hay campos de fecha, selector de rango temporal
- [ ] **Filter Templates:** Plantillas de filtros predefinidas (ej: "Solo Q1", "Top Regions")
- [ ] **Filter Sharing:** URL con filtros codificados para compartir vistas específicas

---

## 11. Referencias / References

- **Archivo Principal:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/DashboardFiltersBar.tsx`
- **Hook Principal:** `solution-sideby/apps/client/src/features/dataset/hooks/useDatasetDashboard.ts`
- **Types:** `solution-sideby/apps/client/src/features/dataset/types/dashboard.types.ts`
- **Inspiración UI:** `solution-sideby-design/src/components/FilterBar.tsx` (referencia de mock)

---

## 12. Checklist de Implementación

### Frontend
- [ ] Actualizar types para multi-select
- [ ] Refactorizar `applyFilters` logic
- [ ] Crear `MultiSelectDropdown` component
- [ ] Actualizar `DashboardFiltersBar` UI
- [ ] Implementar Active Filters Chips
- [ ] Enhanced `TemplateSelector` con iconos
- [ ] Implementar auto-save con debounce
- [ ] Tests unitarios (hooks)
- [ ] Tests de integración (components)
- [ ] E2E tests

### Documentation
- [ ] Actualizar README del módulo
- [ ] Documentar convenciones de filtrado
- [ ] Screenshots de UI nueva

### QA
- [ ] Manual testing en Chrome, Firefox, Safari
- [ ] Mobile testing (iOS/Android)
- [ ] Accessibility audit
- [ ] Performance profiling

---

**Última actualización:** 2026-02-15  
**Próximo Review:** Después de Phase 1 completion
