# 🎨 Frontend Implementation Prompt: RFC-003 Schema Mapping

**Agent:** @Frontend MERN Agent  
**RFC:** [RFC-003-SCHEMA_MAPPING.md](./RFC-003-SCHEMA_MAPPING.md)  
**Methodology:** Test-Driven Development (TDD) - Red-Green-Refactor  
**Priority:** HIGH  
**Estimated Effort:** 2-3 días

---

## 📋 Context

Debes implementar el **Wizard Steps 2 & 3** del flujo de creación de datasets:
- **Step 2 (ColumnMappingStep):** Mapeo de columnas y configuración de KPIs
- **Step 3 (ConfigurationStep):** Metadata, AI prompt, y resumen final

**Flujo completo:**
```
Upload (Step 1 - RFC-002) → Mapping (Step 2) → Configuration (Step 3) → Dashboard
```

---

## 🎯 Objectives

### Must Have (MVP)
1. ✅ Feature flag configuration for AI functionality
2. ✅ ColumnMappingStep component (validate/enhance existing)
3. ✅ ConfigurationStep component (implement complete)
4. ✅ Comprehensive summary preview in Step 3
5. ✅ Full validation (name required, max chars, etc.)
6. ✅ Submit complete configuration to Backend API
7. ✅ Test coverage >85% (TDD approach)

### Nice to Have (Future)
- Auto-classification of columns by data type
- Period detection from date columns
- Advanced KPI configuration UI

---

## 📂 Current State Analysis

### ✅ Already Implemented

#### 1. `ColumnMappingStep.tsx`
**Location:** `apps/client/src/features/dataset/components/wizard/ColumnMappingStep.tsx`

**Current Features:**
- Dimension field selector
- KPI fields list with add/remove functionality
- Format selector (number, currency, percentage)
- Basic validation (min 1 dimension, min 1 KPI)

**What's GOOD:**
- Component structure follows clean architecture
- Uses `useWizardState` hook correctly
- Has validation alerts

**What NEEDS IMPROVEMENT:**
- May lack "highlighted" KPI toggle (max 4 for KPI Cards)
- Preview of data may not be showing Group A vs Group B side-by-side
- Date field detection/selection may be missing

#### 2. `ConfigurationStep.tsx`
**Location:** `apps/client/src/features/dataset/components/wizard/ConfigurationStep.tsx`

**Current Features:**
- Name and description inputs
- AI configuration toggle
- Character counters

**What's MISSING (CRITICAL):**
- ❌ Feature flag check for AI section (`FEATURE_AI_ENABLED`)
- ❌ Comprehensive summary preview (files, unified metrics, KPIs list)
- ❌ Success icon and confirmation message
- ❌ Submit logic to `PATCH /api/v1/datasets/:id`

#### 3. `useWizardState` Hook
**Location:** `apps/client/src/features/dataset/hooks/useWizardState.ts`

**Assumed to Exist:**
```typescript
const {
  fileA,
  fileB,
  mapping,
  metadata,
  aiConfig,
  setMapping,
  setMetadata,
  setAIConfig,
  addKPIField,
  removeKPIField
} = useWizardState();
```

**Verify:** This hook exists and provides all necessary state management.

---

## 🚀 Implementation Plan (TDD Approach)

### Phase 0: Setup (30 min)

#### 0.1 Create Feature Flag Configuration

**File:** `apps/client/src/config/features.ts` (NEW)

```typescript
/**
 * Global Feature Flags Configuration
 * Controladas por variables de entorno
 */

export const FEATURES = {
  /**
   * Habilita/deshabilita la funcionalidad de prompt de IA en ConfigurationStep
   * @default false
   * @env VITE_FEATURE_AI_ENABLED
   */
  AI_ENABLED: import.meta.env.VITE_FEATURE_AI_ENABLED === 'true' || false,
  
  // Future flags...
} as const;

export type FeatureFlags = typeof FEATURES;

// Helper para debugging
if (import.meta.env.DEV) {
  console.log('[Feature Flags]', FEATURES);
}
```

**Environment Variable:**

Add to `.env` and `.env.example`:
```bash
# AI Functionality Feature Flag
VITE_FEATURE_AI_ENABLED=false
```

**Test:** `apps/client/src/config/__tests__/features.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { FEATURES } from '../features';

describe('[TDD] Feature Flags', () => {
  it('should have AI_ENABLED as false by default', () => {
    expect(FEATURES.AI_ENABLED).toBe(false);
  });
  
  it('should read AI_ENABLED from environment', () => {
    vi.stubEnv('VITE_FEATURE_AI_ENABLED', 'true');
    // Re-import para aplicar el cambio
    // expect(FEATURES.AI_ENABLED).toBe(true);
  });
});
```

---

### Phase 1: ColumnMappingStep - Validation & Enhancement (4-6 hours)

#### 1.1 Write Tests FIRST (RED Phase)

**File:** `apps/client/src/features/dataset/__tests__/ColumnMappingStep.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ColumnMappingStep } from '../components/wizard/ColumnMappingStep';
import { WizardStateProvider } from '../context/WizardStateContext';

describe('[TDD] ColumnMappingStep', () => {
  const mockWizardState = {
    fileA: {
      name: 'ventas_2024.csv',
      rowCount: 1200,
      parsedData: {
        headers: ['fecha', 'region', 'ventas', 'visitas', 'roi'],
        rows: [
          ['2024-01', 'Norte', '45000', '12000', '3.2'],
          ['2024-02', 'Sur', '38000', '8000', '2.8'],
        ],
      },
    },
    fileB: {
      name: 'ventas_2023.csv',
      rowCount: 1100,
      parsedData: {
        headers: ['fecha', 'region', 'ventas', 'visitas', 'roi'],
        rows: [
          ['2023-01', 'Norte', '38000', '10000', '2.9'],
          ['2023-02', 'Sur', '32000', '7000', '2.4'],
        ],
      },
    },
    mapping: {
      dimensionField: '',
      dateField: null,
      kpiFields: [],
    },
    setMapping: vi.fn(),
    addKPIField: vi.fn(),
    removeKPIField: vi.fn(),
  };

  const renderComponent = (overrideState = {}) => {
    const state = { ...mockWizardState, ...overrideState };
    return render(
      <WizardStateProvider value={state}>
        <ColumnMappingStep />
      </WizardStateProvider>
    );
  };

  // === PREVIEW TESTS ===
  
  describe('Data Preview', () => {
    it('[RED] should display preview tables for Group A and Group B side-by-side', () => {
      renderComponent();
      
      // Should show both file names
      expect(screen.getByText(/ventas_2024.csv/i)).toBeInTheDocument();
      expect(screen.getByText(/ventas_2023.csv/i)).toBeInTheDocument();
      
      // Should show headers
      expect(screen.getAllByText('fecha')).toHaveLength(2); // One for each table
      expect(screen.getAllByText('ventas')).toHaveLength(2);
    });
    
    it('[RED] should display first 5 rows of data', () => {
      renderComponent();
      
      // Check Group A data
      expect(screen.getByText('2024-01')).toBeInTheDocument();
      expect(screen.getByText('45000')).toBeInTheDocument();
      
      // Check Group B data
      expect(screen.getByText('2023-01')).toBeInTheDocument();
      expect(screen.getByText('38000')).toBeInTheDocument();
    });
  });

  // === DIMENSION FIELD TESTS ===
  
  describe('Dimension Field Selection', () => {
    it('[RED] should show dimension field selector with available columns', () => {
      renderComponent();
      
      const dimensionSelect = screen.getByLabelText(/campo de dimensión/i);
      expect(dimensionSelect).toBeInTheDocument();
      
      // Should have all columns as options
      fireEvent.click(dimensionSelect);
      expect(screen.getByText('fecha')).toBeInTheDocument();
      expect(screen.getByText('region')).toBeInTheDocument();
    });
    
    it('[RED] should call setMapping when dimension is selected', () => {
      const setMapping = vi.fn();
      renderComponent({ setMapping });
      
      const dimensionSelect = screen.getByLabelText(/campo de dimensión/i);
      fireEvent.change(dimensionSelect, { target: { value: 'fecha' } });
      
      expect(setMapping).toHaveBeenCalledWith({ dimensionField: 'fecha' });
    });
    
    it('[RED] should show validation error if no dimension selected', () => {
      renderComponent({ mapping: { dimensionField: '', kpiFields: [] } });
      
      const nextButton = screen.getByRole('button', { name: /continuar/i });
      expect(nextButton).toBeDisabled();
      
      expect(screen.getByText(/al menos 1 dimensión/i)).toBeInTheDocument();
    });
  });

  // === KPI CONFIGURATION TESTS ===
  
  describe('KPI Configuration', () => {
    it('[RED] should display add KPI form with column selector', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/columna kpi/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/etiqueta del kpi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/formato/i)).toBeInTheDocument();
    });
    
    it('[RED] should call addKPIField when adding a new KPI', () => {
      const addKPIField = vi.fn();
      renderComponent({ addKPIField });
      
      // Fill form
      const columnSelect = screen.getByLabelText(/columna kpi/i);
      fireEvent.change(columnSelect, { target: { value: 'ventas' } });
      
      const labelInput = screen.getByPlaceholderText(/etiqueta del kpi/i);
      fireEvent.change(labelInput, { target: { value: 'Ventas Totales' } });
      
      const formatSelect = screen.getByLabelText(/formato/i);
      fireEvent.change(formatSelect, { target: { value: 'currency' } });
      
      const addButton = screen.getByRole('button', { name: /agregar kpi/i });
      fireEvent.click(addButton);
      
      expect(addKPIField).toHaveBeenCalledWith(
        expect.objectContaining({
          columnName: 'ventas',
          label: 'Ventas Totales',
          format: 'currency',
        })
      );
    });
    
    it('[RED] should display list of configured KPIs', () => {
      const mockMapping = {
        dimensionField: 'fecha',
        kpiFields: [
          { id: 'kpi_1', columnName: 'ventas', label: 'Ventas', format: 'currency' },
          { id: 'kpi_2', columnName: 'visitas', label: 'Visitas', format: 'number' },
        ],
      };
      
      renderComponent({ mapping: mockMapping });
      
      expect(screen.getByText('Ventas')).toBeInTheDocument();
      expect(screen.getByText('currency')).toBeInTheDocument();
      expect(screen.getByText('Visitas')).toBeInTheDocument();
      expect(screen.getByText('number')).toBeInTheDocument();
    });
    
    it('[RED] should call removeKPIField when clicking remove button', () => {
      const removeKPIField = vi.fn();
      const mockMapping = {
        dimensionField: 'fecha',
        kpiFields: [
          { id: 'kpi_1', columnName: 'ventas', label: 'Ventas', format: 'currency' },
        ],
      };
      
      renderComponent({ removeKPIField, mapping: mockMapping });
      
      const removeButton = screen.getByRole('button', { name: /eliminar/i });
      fireEvent.click(removeButton);
      
      expect(removeKPIField).toHaveBeenCalledWith('kpi_1');
    });
  });

  // === VALIDATION TESTS ===
  
  describe('Validation', () => {
    it('[RED] should disable next button if no dimension selected', () => {
      renderComponent({ mapping: { dimensionField: '', kpiFields: [{ id: 'kpi_1', columnName: 'ventas', label: 'Ventas', format: 'currency' }] } });
      
      const nextButton = screen.getByRole('button', { name: /continuar/i });
      expect(nextButton).toBeDisabled();
    });
    
    it('[RED] should disable next button if no KPIs configured', () => {
      renderComponent({ mapping: { dimensionField: 'fecha', kpiFields: [] } });
      
      const nextButton = screen.getByRole('button', { name: /continuar/i });
      expect(nextButton).toBeDisabled();
    });
    
    it('[GREEN] should enable next button when valid configuration', () => {
      const mockMapping = {
        dimensionField: 'fecha',
        kpiFields: [
          { id: 'kpi_1', columnName: 'ventas', label: 'Ventas', format: 'currency' },
        ],
      };
      
      renderComponent({ mapping: mockMapping });
      
      const nextButton = screen.getByRole('button', { name: /continuar/i });
      expect(nextButton).not.toBeDisabled();
    });
    
    it('[RED] should show validation summary', () => {
      const mockMapping = {
        dimensionField: 'fecha',
        kpiFields: [
          { id: 'kpi_1', columnName: 'ventas', label: 'Ventas', format: 'currency' },
          { id: 'kpi_2', columnName: 'visitas', label: 'Visitas', format: 'number' },
        ],
      };
      
      renderComponent({ mapping: mockMapping });
      
      expect(screen.getByText(/al menos 1 dimensión seleccionada/i)).toBeInTheDocument();
      expect(screen.getByText(/al menos 1 kpi numérico seleccionado/i)).toBeInTheDocument();
    });
  });

  // === DATE FIELD TESTS (Optional) ===
  
  describe('Date Field Detection', () => {
    it('[RED] should show date field selector if date columns detected', () => {
      renderComponent();
      
      // Should have checkbox or selector for date field
      const dateCheckbox = screen.queryByLabelText(/usar como columna de tiempo/i);
      if (dateCheckbox) {
        expect(dateCheckbox).toBeInTheDocument();
      }
    });
  });
});
```

#### 1.2 Implement/Fix Component (GREEN Phase)

**File:** `apps/client/src/features/dataset/components/wizard/ColumnMappingStep.tsx`

**Requirements:**
1. ✅ Show side-by-side preview of Group A and Group B data (first 5 rows)
2. ✅ Dimension field selector (dropdown with all columns)
3. ✅ KPI configuration form:
   - Column selector (only columns not used as dimension)
   - Label input (max 50 chars)
   - Format selector (number, currency, percentage)
   - Add button
4. ✅ List of configured KPIs with remove button
5. ✅ Validation summary:
   - ✅/❌ At least 1 dimension selected
   - ✅/❌ At least 1 KPI configured
6. ✅ Next button disabled if invalid
7. ✅ (Optional) Date field detection checkbox

**Visual Reference:** `SideBy-Design/src/pages/DataMappingWizard.tsx`

**Key Code Patterns:**

```tsx
// Data Preview Tables
<div className="grid gap-6 lg:grid-cols-2">
  <FilePreview
    fileName={fileA.name}
    label="Archivo A (Grupo A)"
    variant="primary"
    headers={fileA.parsedData.headers}
    rows={fileA.parsedData.rows.slice(0, 5)}
  />
  <FilePreview
    fileName={fileB.name}
    label="Archivo B (Grupo B)"
    variant="comparative"
    headers={fileB.parsedData.headers}
    rows={fileB.parsedData.rows.slice(0, 5)}
  />
</div>

// Validation Logic
const isValid = useMemo(() => {
  return mapping.dimensionField && mapping.kpiFields.length > 0;
}, [mapping]);

// Character Counter
<div className="flex justify-between">
  <Label>Etiqueta del KPI</Label>
  <span className="text-xs text-muted-foreground">
    {kpiLabel.length}/50
  </span>
</div>
```

#### 1.3 Run Tests & Refactor (REFACTOR Phase)

```bash
cd apps/client
npm run test -- ColumnMappingStep.test.tsx
```

**Ensure:** All tests pass ✅

**Refactor:** Improve code quality, extract reusable components if needed.

---

### Phase 2: ConfigurationStep - Complete Implementation (6-8 hours)

#### 2.1 Write Tests FIRST (RED Phase)

**File:** `apps/client/src/features/dataset/__tests__/ConfigurationStep.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigurationStep } from '../components/wizard/ConfigurationStep';
import { WizardStateProvider } from '../context/WizardStateContext';
import * as features from '@/config/features';

describe('[TDD] ConfigurationStep', () => {
  const mockWizardState = {
    metadata: { name: '', description: '' },
    aiConfig: { enabled: false, userContext: '' },
    setMetadata: vi.fn(),
    setAIConfig: vi.fn(),
    fileA: {
      name: 'ventas_2024.csv',
      rowCount: 1200,
      parsedData: { headers: ['fecha', 'ventas', 'visitas'], rows: [] },
    },
    fileB: {
      name: 'ventas_2023.csv',
      rowCount: 1100,
      parsedData: { headers: ['fecha', 'ventas', 'visitas'], rows: [] },
    },
    mapping: {
      dimensionField: 'fecha',
      dateField: 'fecha',
      kpiFields: [
        { id: 'kpi_1', columnName: 'ventas', label: 'Ventas Totales', format: 'currency' },
        { id: 'kpi_2', columnName: 'visitas', label: 'Tráfico Web', format: 'number' },
      ],
    },
  };

  const renderComponent = (overrideState = {}, featureFlags = {}) => {
    const state = { ...mockWizardState, ...overrideState };
    
    // Mock feature flags
    vi.spyOn(features, 'FEATURES', 'get').mockReturnValue({
      AI_ENABLED: false,
      ...featureFlags,
    });
    
    return render(
      <WizardStateProvider value={state}>
        <ConfigurationStep />
      </WizardStateProvider>
    );
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // === METADATA FORM TESTS ===
  
  describe('Report Metadata', () => {
    it('[RED] should display name input field (required)', () => {
      renderComponent();
      
      const nameInput = screen.getByLabelText(/nombre/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('maxlength', '100');
    });
    
    it('[RED] should show character counter for name (0/100)', () => {
      renderComponent();
      
      expect(screen.getByText('0/100 caracteres')).toBeInTheDocument();
    });
    
    it('[RED] should update character counter as user types', () => {
      const setMetadata = vi.fn();
      renderComponent({ setMetadata });
      
      const nameInput = screen.getByLabelText(/nombre/i);
      fireEvent.change(nameInput, { target: { value: 'Mi Report' } });
      
      expect(setMetadata).toHaveBeenCalledWith({ name: 'Mi Report' });
    });
    
  });

  // === AI FEATURE FLAG TESTS ===
  
  describe('AI Configuration (Feature Flag)', () => {
    it('[RED] should HIDE AI section when FEATURE_AI_ENABLED is false', () => {
      renderComponent({}, { AI_ENABLED: false });
      
      expect(screen.queryByText(/análisis con ia/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: /habilitar/i })).not.toBeInTheDocument();
    });
    
    it('[GREEN] should SHOW AI section when FEATURE_AI_ENABLED is true', () => {
      renderComponent({}, { AI_ENABLED: true });
      
      expect(screen.getByText(/análisis con ia/i)).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
      expect(screen.getByText(/beta/i)).toBeInTheDocument();
    });
    
    it('[RED] should show AI prompt textarea when toggle is enabled', () => {
      const setAIConfig = vi.fn();
      renderComponent({ setAIConfig }, { AI_ENABLED: true });
      
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      expect(setAIConfig).toHaveBeenCalledWith({ enabled: true });
    });
    
    it('[RED] should show character counter for AI prompt (0/500)', () => {
      renderComponent(
        { aiConfig: { enabled: true, userContext: '' } },
        { AI_ENABLED: true }
      );
      
      expect(screen.getByText('0/500 caracteres')).toBeInTheDocument();
    });
    
    it('[RED] should validate AI prompt max length (500 chars)', () => {
      const setAIConfig = vi.fn();
      renderComponent(
        { aiConfig: { enabled: true, userContext: '' }, setAIConfig },
        { AI_ENABLED: true }
      );
      
      const promptTextarea = screen.getByPlaceholderText(/contexto para ia/i);
      expect(promptTextarea).toHaveAttribute('maxlength', '500');
    });
  });

  // === SUMMARY PREVIEW TESTS ===
  
  describe('Summary Preview', () => {
    it('[RED] should display success icon and title', () => {
      renderComponent();
      
      expect(screen.getByText(/datos unificados correctamente/i)).toBeInTheDocument();
      // Check for success icon (CheckCircle2)
      const successIcon = screen.getByRole('img', { hidden: true }); // Lucide icons have role="img"
      expect(successIcon).toBeInTheDocument();
    });
    
    it('[RED] should display File A summary card', () => {
      renderComponent();
      
      expect(screen.getByText('ventas_2024.csv')).toBeInTheDocument();
      expect(screen.getByText('1200 filas')).toBeInTheDocument();
      expect(screen.getByText(/archivo a/i)).toBeInTheDocument();
    });
    
    it('[RED] should display File B summary card', () => {
      renderComponent();
      
      expect(screen.getByText('ventas_2023.csv')).toBeInTheDocument();
      expect(screen.getByText('1100 filas')).toBeInTheDocument();
      expect(screen.getByText(/archivo b/i)).toBeInTheDocument();
    });
    
    it('[RED] should calculate and display total rows (2300)', () => {
      renderComponent();
      
      expect(screen.getByText('2,300')).toBeInTheDocument(); // With comma formatting
    });
    
    it('[RED] should display dimension field name', () => {
      renderComponent();
      
      expect(screen.getByText(/campo dimensión/i)).toBeInTheDocument();
      expect(screen.getByText('fecha')).toBeInTheDocument();
    });
    
    it('[RED] should display date column if configured', () => {
      renderComponent();
      
      expect(screen.getByText(/columna de fecha/i)).toBeInTheDocument();
      expect(screen.getByText('fecha')).toBeInTheDocument();
    });
    
    it('[RED] should display KPI count', () => {
      renderComponent();
      
      expect(screen.getByText(/kpis configurados/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    
    it('[RED] should display list of configured KPIs with formats', () => {
      renderComponent();
      
      expect(screen.getByText('Ventas Totales (currency)')).toBeInTheDocument();
      expect(screen.getByText('Tráfico Web (number)')).toBeInTheDocument();
    });
    
    it('[RED] should use different border colors for File A and File B cards', () => {
      const { container } = renderComponent();
      
      const fileCards = container.querySelectorAll('[data-file-card]');
      expect(fileCards).toHaveLength(2);
      
      // File A should have primary border
      expect(fileCards[0]).toHaveClass(/border-l-data-primary/);
      // File B should have comparative border
      expect(fileCards[1]).toHaveClass(/border-l-data-comparative/);
    });
  });

  // === VALIDATION TESTS ===
  
  describe('Validation', () => {
    it('[RED] should disable finish button when name is empty', () => {
      renderComponent({ metadata: { name: '', description: '' } });
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      expect(finishButton).toBeDisabled();
    });
    
    it('[GREEN] should enable finish button when name is filled', () => {
      renderComponent({ metadata: { name: 'Mi Report', description: '' } });
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      expect(finishButton).not.toBeDisabled();
    });
    
    it('[RED] should show validation message when name is empty', () => {
      renderComponent({ metadata: { name: '', description: '' } });
      
      expect(screen.getByText(/nombre del report es obligatorio/i)).toBeInTheDocument();
    });
  });

  // === SUBMISSION TESTS ===
  
  describe('Submit Configuration', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });
    
    it('[RED] should call PATCH API with complete payload on submit', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { datasetId: 'test-123' } }),
      });
      global.fetch = mockFetch;
      
      renderComponent({ metadata: { name: 'Test Report', description: '' } });
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      fireEvent.click(finishButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/datasets/'),
          expect.objectContaining({
            method: 'PATCH',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('"name":"Test Report"'),
          })
        );
      });
    });
    
    it('[RED] should include meta, schemaMapping, dashboardLayout in payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;
      
      renderComponent({ metadata: { name: 'Test Report', description: '' } });
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      fireEvent.click(finishButton);
      
      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        const payload = JSON.parse(callArgs[1].body);
        
        expect(payload).toHaveProperty('meta');
        expect(payload.meta).toHaveProperty('name', 'Test Report');
        expect(payload).toHaveProperty('schemaMapping');
        expect(payload.schemaMapping).toHaveProperty('dimensionField', 'fecha');
        expect(payload).toHaveProperty('dashboardLayout');
        expect(payload.dashboardLayout).toHaveProperty('templateId', 'sideby_executive');
      });
    });
    
    it('[RED] should include aiConfig only if AI is enabled', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;
      
      renderComponent(
        {
          metadata: { name: 'Test Report', description: '' },
          aiConfig: { enabled: true, userContext: 'Test prompt' },
        },
        { AI_ENABLED: true }
      );
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      fireEvent.click(finishButton);
      
      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        const payload = JSON.parse(callArgs[1].body);
        
        expect(payload).toHaveProperty('aiConfig');
        expect(payload.aiConfig).toHaveProperty('enabled', true);
        expect(payload.aiConfig).toHaveProperty('userContext', 'Test prompt');
      });
    });
    
    it('[GREEN] should navigate to dashboard on successful submit', async () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', () => ({
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'test-dataset-id' }),
      }));
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { datasetId: 'test-123' } }),
      });
      
      renderComponent({ metadata: { name: 'Test Report', description: '' } });
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      fireEvent.click(finishButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/datasets/test-dataset-id/dashboard');
      });
    });
    
    it('[RED] should show error toast on failed submit', async () => {
      const mockToast = vi.fn();
      vi.mock('@/hooks/use-toast', () => ({
        useToast: () => ({ toast: mockToast }),
      }));
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed' }),
      });
      
      renderComponent({ metadata: { name: 'Test Report', description: '' } });
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      fireEvent.click(finishButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Error'),
            variant: 'destructive',
          })
        );
      });
    });
    
    it('[RED] should show loading state during submission', async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      
      renderComponent({ metadata: { name: 'Test Report', description: '' } });
      
      const finishButton = screen.getByRole('button', { name: /finalizar/i });
      fireEvent.click(finishButton);
      
      // During loading
      expect(screen.getByText(/guardando/i)).toBeInTheDocument();
      expect(finishButton).toBeDisabled();
      
      // Should show spinner
      const spinner = screen.getByRole('img', { hidden: true }); // Lucide Loader2
      expect(spinner).toHaveClass('animate-spin');
    });
  });
});
```

#### 2.2 Implement Component (GREEN Phase)

**File:** `apps/client/src/features/dataset/components/wizard/ConfigurationStep.tsx`

**Requirements:**

1. ✅ **Report Name Input:**
   - Required field
   - Max 100 characters
   - Character counter: `{value.length}/100 caracteres`
   - Validation message if empty

3. ✅ **AI Configuration (Feature Flag Controlled):**
   ```tsx
   import { FEATURES } from '@/config/features';
   
   {FEATURES.AI_ENABLED && (
     <Card>
       <div className="flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-primary" />
             <h3>Análisis con IA</h3>
             <Badge variant="secondary">Beta</Badge>
           </div>
           <p className="text-sm text-muted-foreground">
             Genera insights automáticos basados en tus datos
           </p>
         </div>
         
         {/* Toggle Switch */}
         <Switch
           checked={aiConfig.enabled}
           onCheckedChange={(enabled) => setAIConfig({ enabled })}
         />
       </div>
       
       {aiConfig.enabled && (
         <div className="mt-4">
           <Label>Contexto para la IA (opcional)</Label>
           <Textarea
             value={aiConfig.userContext}
             onChange={(e) => setAIConfig({ userContext: e.target.value })}
             placeholder="Ej: Analiza esto como un CFO buscando optimizar costos..."
             maxLength={500}
             rows={4}
           />
           <p className="text-xs text-muted-foreground">
             {aiConfig.userContext.length}/500 caracteres
           </p>
         </div>
       )}
     </Card>
   )}
   ```

4. ✅ **Comprehensive Summary Preview:**
   
   Based on `SideBy-Design/src/pages/DataFinishWizard.tsx`:
   
   ```tsx
   {/* Success Message */}
   <div className="flex flex-col items-center justify-center py-8">
     <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-data-positive/10">
       <CheckCircle2 className="h-10 w-10 text-data-positive" />
     </div>
     <h1 className="mb-2 text-2xl font-semibold">
       ¡Datos Unificados Correctamente!
     </h1>
     <p className="text-center text-muted-foreground">
       Tus datasets han sido procesados y están listos para el análisis comparativo.
     </p>
   </div>

   {/* File Summaries */}
   <div className="grid gap-4 md:grid-cols-2">
     {/* File A Card */}
     <Card className="border-l-4 border-l-data-primary" data-file-card>
       <CardContent className="p-4">
         <div className="flex items-start gap-3">
           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-data-primary/10">
             <FileSpreadsheet className="h-5 w-5 text-data-primary" />
           </div>
           <div className="flex-1">
             <p className="text-sm text-muted-foreground">Archivo A</p>
             <p className="font-medium">{fileA.name}</p>
             <div className="mt-2 flex flex-wrap gap-2">
               <Badge variant="secondary" className="text-xs">
                 {fileA.rowCount.toLocaleString()} filas
               </Badge>
               {/* Period detection (optional) */}
               <Badge variant="outline" className="text-xs">
                 {detectPeriod(fileA)}
               </Badge>
             </div>
           </div>
         </div>
       </CardContent>
     </Card>

     {/* File B Card */}
     <Card className="border-l-4 border-l-data-comparative" data-file-card>
       {/* Similar structure */}
     </Card>
   </div>

   {/* Unified Dataset Metrics */}
   <Card>
     <CardContent className="p-6">
       <div className="mb-4 flex items-center gap-2">
         <Layers className="h-5 w-5 text-primary" />
         <h2 className="font-semibold">Dataset Unificado</h2>
       </div>

       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
         {/* Total Rows */}
         <div className="space-y-1">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Hash className="h-4 w-4" />
             Total de Filas
           </div>
           <p className="text-2xl font-semibold">
             {(fileA.rowCount + fileB.rowCount).toLocaleString()}
           </p>
         </div>

         {/* Date Column */}
         <div className="space-y-1">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Calendar className="h-4 w-4" />
             Columna de Fecha
           </div>
           <p className="text-2xl font-semibold">
             {mapping.dateField || 'N/A'}
           </p>
         </div>

         {/* KPIs Count */}
         <div className="space-y-1">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <BarChart3 className="h-4 w-4" />
             KPIs Configurados
           </div>
           <p className="text-2xl font-semibold">
             {mapping.kpiFields.length}
           </p>
         </div>

         {/* Dimension Field */}
         <div className="space-y-1">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Layers className="h-4 w-4" />
             Campo Dimensión
           </div>
           <p className="text-2xl font-semibold">
             {mapping.dimensionField}
           </p>
         </div>
       </div>

       {/* KPI List */}
       <div className="mt-6 space-y-2">
         <h3 className="text-sm font-semibold">KPIs Seleccionados:</h3>
         <div className="flex flex-wrap gap-2">
           {mapping.kpiFields.map((kpi) => (
             <Badge key={kpi.id} variant="outline">
               {kpi.label} ({kpi.format})
             </Badge>
           ))}
         </div>
       </div>
     </CardContent>
   </Card>
   ```

5. ✅ **Submit Logic:**
   
   ```tsx
   const handleFinish = async () => {
     // Validation
     if (!metadata.name || metadata.name.trim().length === 0) {
       toast({
         title: '❌ Error de Validación',
         description: 'El nombre del report es obligatorio',
         variant: 'destructive',
       });
       return;
     }
     
     setIsSubmitting(true);
     
     try {
       const payload = {
         meta: {
           name: metadata.name,
           description: '', // Show like optional from UI but stored
         },
         schemaMapping: {
           dimensionField: mapping.dimensionField,
           dateField: mapping.dateField,
           kpiFields: mapping.kpiFields.map((kpi) => ({
             id: kpi.id,
             columnName: kpi.columnName,
             label: kpi.label,
             format: kpi.format,
           })),
         },
         dashboardLayout: {
           templateId: 'sideby_executive',
           highlightedKpis: mapping.kpiFields.slice(0, 4).map((k) => k.id),
         },
         aiConfig: FEATURES.AI_ENABLED && aiConfig.enabled
           ? {
               enabled: aiConfig.enabled,
               userContext: aiConfig.userContext,
             }
           : undefined,
       };
       
       const response = await fetch(`/api/v1/datasets/${datasetId}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(payload),
       });
       
       if (!response.ok) {
         throw new Error('Error al guardar configuración');
       }
       
       const result = await response.json();
       
       toast({
         title: '✅ Dataset Creado',
         description: 'Tu dataset está listo para visualizar',
       });
       
       navigate(`/datasets/${datasetId}/dashboard`);
     } catch (error) {
       toast({
         title: '❌ Error',
         description: 'No se pudo guardar la configuración. Intenta de nuevo.',
         variant: 'destructive',
       });
     } finally {
       setIsSubmitting(false);
     }
   };
   ```

**Visual Reference:** `SideBy-Design/src/pages/DataFinishWizard.tsx`

#### 2.3 Run Tests & Refactor (REFACTOR Phase)

```bash
cd apps/client
npm run test -- ConfigurationStep.test.tsx
```

**Ensure:** All tests pass ✅

**Refactor:** Extract summary cards into reusable components if needed.

---

### Phase 3: Helper Components (2-4 hours)

You may need to create helper components:

#### 3.1 FilePreview Component

**File:** `apps/client/src/features/dataset/components/FilePreview.tsx`

```tsx
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface FilePreviewProps {
  fileName: string;
  label: string;
  variant: 'primary' | 'comparative';
  headers: string[];
  rows: any[][];
}

export const FilePreview = ({
  fileName,
  label,
  variant,
  headers,
  rows,
}: FilePreviewProps) => {
  const colorClass =
    variant === 'primary'
      ? 'bg-data-primary text-white'
      : 'bg-data-comparative text-white';

  return (
    <Card>
      <div className={`px-4 py-2 font-semibold ${colorClass}`}>
        {label}: {fileName}
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### 3.2 Period Detection Utility (Optional)

**File:** `apps/client/src/features/dataset/utils/periodDetection.ts`

```typescript
/**
 * Intenta detectar el periodo de tiempo en un dataset basado en la columna de fecha
 * @returns String con el periodo detectado o 'N/A'
 */
export function detectPeriod(file: { parsedData: { headers: string[]; rows: any[][] } }): string {
  const dateColumnIndex = file.parsedData.headers.findIndex((h) =>
    /fecha|date|time/i.test(h)
  );

  if (dateColumnIndex === -1) return 'N/A';

  const dates = file.parsedData.rows
    .map((row) => row[dateColumnIndex])
    .filter((val) => val && isValidDate(val));

  if (dates.length === 0) return 'N/A';

  dates.sort();
  const firstDate = formatDate(dates[0]);
  const lastDate = formatDate(dates[dates.length - 1]);

  return `${firstDate} - ${lastDate}`;
}

function isValidDate(value: any): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function formatDate(value: any): string {
  const date = new Date(value);
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}
```

---

### Phase 4: Integration & E2E Testing (2 hours)

#### 4.1 Integration Test

**File:** `apps/client/src/features/dataset/__tests__/wizard-integration.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardContainer } from '../pages/WizardContainer';
import { BrowserRouter } from 'react-router-dom';

describe('[INTEGRATION] Dataset Creation Wizard', () => {
  it('should complete full wizard flow: Mapping → Configuration → Submit', async () => {
    // Mock API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { datasetId: 'test-123' } }),
    });

    render(
      <BrowserRouter>
        <WizardContainer />
      </BrowserRouter>
    );

    // Step 2: Mapping
    const dimensionSelect = await screen.findByLabelText(/campo de dimensión/i);
    fireEvent.change(dimensionSelect, { target: { value: 'fecha' } });

    const columnSelect = screen.getByLabelText(/columna kpi/i);
    fireEvent.change(columnSelect, { target: { value: 'ventas' } });

    const labelInput = screen.getByPlaceholderText(/etiqueta del kpi/i);
    fireEvent.change(labelInput, { target: { value: 'Ventas' } });

    const addButton = screen.getByRole('button', { name: /agregar kpi/i });
    fireEvent.click(addButton);

    const nextButton = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(nextButton);

    // Step 3: Configuration
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nameInput, { target: { value: 'Test Report' } });

    const finishButton = screen.getByRole('button', { name: /finalizar/i });
    fireEvent.click(finishButton);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/datasets/'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });
});
```

---

### Phase 5: Final Validation & Cleanup (1 hour)

#### 5.1 Run All Tests

```bash
cd apps/client
npm run test
```

**Target:** >85% coverage

#### 5.2 Linting & Formatting

```bash
npm run lint
npm run format
```

#### 5.3 Manual QA Checklist

- [ ] ColumnMappingStep shows preview tables for A and B
- [ ] Dimension selector works
- [ ] KPI add/remove works
- [ ] Format selectors work
- [ ] Validation summary shows correct state
- [ ] Next button disabled when invalid
- [ ] ConfigurationStep name input has character counter
- [ ] AI section ONLY shows if `VITE_FEATURE_AI_ENABLED=true`
- [ ] Summary shows all metrics correctly
- [ ] Finish button disabled when name empty
- [ ] Submit sends correct payload
- [ ] Success redirects to dashboard
- [ ] Error shows toast message

---

## 📦 Deliverables

### Code Files
1. ✅ `config/features.ts` (NEW)
2. ✅ `components/wizard/ColumnMappingStep.tsx` (ENHANCED)
3. ✅ `components/wizard/ConfigurationStep.tsx` (REWRITTEN)
4. ✅ `components/FilePreview.tsx` (NEW)
5. ✅ `utils/periodDetection.ts` (NEW - Optional)

### Test Files
1. ✅ `__tests__/features.test.ts` (NEW)
2. ✅ `__tests__/ColumnMappingStep.test.tsx` (NEW)
3. ✅ `__tests__/ConfigurationStep.test.tsx` (NEW)
4. ✅ `__tests__/wizard-integration.test.tsx` (NEW)

### Environment Configuration
1. ✅ `.env` updated with `VITE_FEATURE_AI_ENABLED=false`
2. ✅ `.env.example` updated

---

## 🎓 Key Principles to Follow

1. **TDD Always:** Write tests BEFORE implementation (Red-Green-Refactor)
2. **Feature Flags:** Use `FEATURES.AI_ENABLED` from config, not hardcoded
3. **Validation:** Always validate on both frontend and backend
4. **User Feedback:** Show clear error/success messages
5. **Loading States:** Show spinners during async operations
6. **Accessibility:** Use semantic HTML and ARIA labels
7. **Performance:** Memoize expensive calculations with `useMemo`
8. **DRY:** Extract reusable components (FilePreview, MetricCard, etc.)

---

## 🆘 If You Get Stuck

1. **Check Visual References:**
   - `SideBy-Design/src/pages/DataMappingWizard.tsx`
   - `SideBy-Design/src/pages/DataFinishWizard.tsx`

2. **Review RFC-003:**
   - [docs/design/RFC-003-SCHEMA_MAPPING.md](./RFC-003-SCHEMA_MAPPING.md)

3. **Check Existing Code:**
   - `ColumnMappingStep.tsx` (current implementation)
   - `ConfigurationStep.tsx` (current implementation)

4. **Ask Questions:**
   - If requirements are unclear
   - If test cases are ambiguous
   - If API contract is uncertain

---

## ✅ Success Criteria

- [ ] All tests pass (>85% coverage)
- [ ] No ESLint errors
- [ ] Feature flag works correctly
- [ ] Summary preview matches design
- [ ] Submit sends correct payload
- [ ] Navigation works after success
- [ ] Manual QA checklist complete

---

**Good luck! Remember: Tests First, then Code! 🚀**
