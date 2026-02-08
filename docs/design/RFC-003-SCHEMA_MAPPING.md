# [RFC-003] Schema Mapping & Column Classification (Wizard Step 2)

| Metadata | Details |
| :--- | :--- |
| **Author** | SideBy Team |
| **Status** | **Draft** |
| **Date** | 2026-02-08 |
| **Scope** | `apps/client/src/features/dataset`, `apps/api/src/modules/datasets` |
| **Based on** | UC-CORE-02: Mapeo de Columnas (Normalization) |
| **Depends on** | RFC-002 (Data Ingestion) |
| **Reviewers** | @Architect, @Frontend |

---

## 1. Context & Scope

### Problem Statement
After uploading two CSV/Excel files (Group A vs Group B), the system has raw data with arbitrary column names. Users need a visual interface to:
1. **Preview** the first rows of both datasets side-by-side.
2. **Classify** each column as: **Dimension** (X-axis), **Numeric KPI** (Y-axis metrics), or **Categorical Field** (filters/segmentation).
3. **Select** which KPIs should be highlighted as "Hero Metrics" (max 4 KPI Cards in the dashboard).
4. **Choose** a date column (if exists) to enable time-series visualizations.

This mapping configuration will determine how data is visualized in the final dashboard.

### Goals
- Provide an intuitive **2-step wizard** (Steps 2 & 3) after file upload:
  - **Step 2 (ColumnMappingStep)**: Schema mapping and KPI selection.
  - **Step 3 (ConfigurationStep)**: Report name, AI prompt, and final review.
- **Auto-classify** columns based on data types (numbers → KPIs, text → categorical, first column → dimension).
- Allow users to **correct** auto-classification via dropdowns and add/remove KPIs.
- Validate that:
  - At least **1 Dimension** is selected.
  - At least **1 Numeric KPI** is selected.
  - Report **name** is provided (max 100 chars).
- **AI Prompt** functionality controlled by global feature flag `FEATURE_AI_ENABLED`.
- Show **comprehensive summary** in Step 3 before finalizing (files, unified data, KPIs, etc.).
- Save the complete configuration to Backend, updating `Dataset` entity with `meta`, `schemaMapping`, `dashboardLayout`, and `aiConfig`.
- Assign a default dashboard template: **`sideby_executive`** (KPI Cards + 1 Chart + Table).

### Non-Goals (Out of Scope)
- Data transformations (date parsing, unit conversions) → Future RFC.
- Manual column renaming → Future RFC.
- Advanced filtering logic → Will be handled in Dashboard RFC.
- Support for different headers between Group A and Group B → Already enforced in RFC-002 (headers must match).
- Dataset description field → Show like optional from UI, kept in data model as optional.

---

## 2. Proposed Solution (Architecture)

### Wizard Flow Overview

The mapping process is part of a **3-step wizard**:

1. **Step 1: Data Upload** (RFC-002) - Upload CSV/Excel files
2. **Step 2: Column Mapping** (This RFC) - Classify columns and select KPIs
3. **Step 3: Configuration & Review** (This RFC) - Name, AI prompt, final summary

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WIZARD: STEPS 2 & 3 (MAPPING + CONFIG)                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐                 ┌───────────────────┐
│   Frontend        │                 │   Backend         │
│   (React)         │                 │   (Express)       │
└─────────┬─────────┘                 └─────────┬─────────┘
          │                                     │
          │ === STEP 2: COLUMN MAPPING ===     │
          │                                     │
          │ 1. GET /api/v1/datasets/:id        │
          │    (Fetch uploaded dataset)         │
          ├────────────────────────────────────>│
          │                                     │
          │<────────────────────────────────────┤
          │ 200 OK { dataset }                  │
          │  - data: DataRow[] (first 10 rows)  │
          │  - sourceConfig: { groupA, groupB } │
          │                                     │
          │ 2. AUTO-CLASSIFY columns            │
          │    (Frontend Logic)                 │
          │    - Analyze data types             │
          │    - Detect date columns            │
          │    - Assign initial roles           │
          │                                     │
          │ 3. User reviews & adjusts mapping   │
          │    - Select dimension field         │
          │    - Add/Remove/Configure KPIs      │
          │    - Set formats (currency, %, #)   │
          │                                     │
          │ === STEP 3: CONFIGURATION ===       │
          │                                     │
          │ 4. User fills metadata:             │
          │    - Report name (required)         │
          │    - AI prompt (if flag enabled)    │
          │                                     │
          │ 5. Show summary preview:            │
          │    - Files info (rows, periods)     │
          │    - Unified dataset metrics        │
          │    - Selected KPIs & dimension      │
          │                                     │
          │ 6. PATCH /api/v1/datasets/:id       │
          │    (Save complete configuration)    │
          │    Body: {                          │
          │      meta: { name, description? }   │
          │      schemaMapping: {...},          │
          │      dashboardLayout: {...},        │
          │      aiConfig: { enabled, prompt }  │
          │    }                                │
          ├────────────────────────────────────>│
          │                                     │
          │                                     │ 7. Validate & Update
          │                                     │    - status = 'ready'
          │                                     │    - Persist all config
          │                                     │
          │<────────────────────────────────────┤
          │ 200 OK { datasetId }                │
          │                                     │
          │ 8. Navigate to Dashboard            │
          │    /datasets/:id/dashboard          │
          │                                     │
```

### Key User Interactions (UX)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Mapea las Columnas                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 Preview de los Datos (Primeras 5 filas)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Grupo A: Año Actual (2024)    │  Grupo B: Año Anterior (2023)  │   │
│  ├──────────┬────────┬──────────┼──────────┬────────┬──────────────┤   │
│  │ fecha    │ ventas │ visitas  │ fecha    │ ventas │ visitas      │   │
│  ├──────────┼────────┼──────────┼──────────┼────────┼──────────────┤   │
│  │ 2024-01  │ 1500   │ 300      │ 2023-01  │ 1200   │ 280          │   │
│  │ 2024-02  │ 1600   │ 320      │ 2023-02  │ 1300   │ 290          │   │
│  │ ...      │ ...    │ ...      │ ...      │ ...    │ ...          │   │
│  └──────────┴────────┴──────────┴──────────┴────────┴──────────────┘   │
│                                                                         │
│  🏷️ Clasificación de Columnas                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Columna: fecha                                                  │   │
│  │ Tipo detectado: [📅 Fecha]                                      │   │
│  │ Rol: ┌────────────────▼─────────────────────┐                  │   │
│  │      │ 🔹 Dimensión (Eje X)                 │ ✅ AUTO           │   │
│  │      │ 📊 KPI Numérico                      │                  │   │
│  │      │ 🏷️ Campo Categórico                  │                  │   │
│  │      └─────────────────────────────────────┘                   │   │
│  │ ⏱️ [✔] Usar como columna de Tiempo (para gráficos temporales)  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Columna: ventas                                                 │   │
│  │ Tipo detectado: [🔢 Número]                                     │   │
│  │ Rol: ┌────────────────▼─────────────────────┐                  │   │
│  │      │ 🔹 Dimensión (Eje X)                 │                  │   │
│  │      │ 📊 KPI Numérico                      │ ✅ AUTO           │   │
│  │      │ 🏷️ Campo Categórico                  │                  │   │
│  │      └─────────────────────────────────────┘                   │   │
│  │ 💡 [✔] Destacar en KPI Card (máx. 4)                           │   │
│  │ Formato: [💰 Moneda ▼]  Etiqueta: "Ventas Totales"            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Columna: visitas                                                │   │
│  │ Tipo detectado: [🔢 Número]                                     │   │
│  │ Rol: [📊 KPI Numérico ▼]                              ✅ AUTO   │   │
│  │ 💡 [✔] Destacar en KPI Card                                     │   │
│  │ Formato: [🔢 Número ▼]  Etiqueta: "Tráfico Web"                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ⚠️ Validación:                                                        │
│  [✅] Al menos 1 Dimensión seleccionada                                │
│  [✅] Al menos 1 KPI Numérico seleccionado                             │
│  [❌] Máximo 4 KPIs destacados (tienes 5) ← Error visual               │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐                            │
│  │  ← Atrás        │  │  Continuar →    │  ← Disabled si hay errores │
│  └─────────────────┘  └─────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Specification (`apps/api`)

### 3.1 Domain Layer Updates (`modules/datasets/domain`)

**No new entities needed.** The `Dataset` entity defined in RFC-002 already includes:
- `schemaMapping?: { dimensionField, kpiFields }` (to be populated).
- `dashboardLayout?: { templateId, highlightedKpis, rows }` (to be populated).

#### Validation Rules

```typescript
// modules/datasets/domain/mapping.rules.ts

export const MappingRules = {
  MIN_DIMENSIONS: 1,
  MIN_KPIS: 1,
  MAX_HIGHLIGHTED_KPIS: 4,
};

export class MappingValidationError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_DIMENSION' | 'MISSING_KPI' | 'TOO_MANY_HIGHLIGHTED'
  ) {
    super(message);
    this.name = 'MappingValidationError';
  }
}
```

### 3.2 Application Layer (`modules/datasets/application`)

#### DTO: UpdateSchemaMappingInput

```typescript
// modules/datasets/application/dtos/UpdateSchemaMapping.dto.ts

export interface UpdateSchemaMappingInput {
  datasetId: string;
  
  // Step 3: Metadata
  meta: {
    name: string;                   // Report name (required, max 100 chars)
    description?: string;           // Optional, hidden in UI but stored
  };
  
  // Step 2: Schema Mapping
  schemaMapping: {
    dimensionField: string;         // e.g., "fecha"
    dateField?: string;             // e.g., "fecha" (if it's also a date)
    kpiFields: Array<{
      id: string;                   // Unique ID (e.g., "kpi_1234567890")
      columnName: string;           // Column name from CSV
      label: string;                // User-friendly label
      format: 'number' | 'currency' | 'percentage';
    }>;
    categoricalFields?: string[];   // For future filtering
  };
  
  // Dashboard Template (Auto-assigned)
  dashboardLayout: {
    templateId: 'sideby_executive'; // Fixed for MVP
    highlightedKpis: string[];      // Array of KPI IDs (max 4)
  };
  
  // Step 3: AI Configuration (Feature Flag Controlled)
  aiConfig?: {
    enabled: boolean;               // Controlled by FEATURE_AI_ENABLED
    userContext?: string;           // AI prompt/context (max 500 chars)
  };
}
```

#### Use Case: UpdateSchemaMappingUseCase

```typescript
// modules/datasets/application/use-cases/UpdateSchemaMappingUseCase.ts

import { DatasetRepository } from '../../domain/DatasetRepository.js';
import { MappingRules, MappingValidationError } from '../../domain/mapping.rules.js';
import { UpdateSchemaMappingInput } from '../dtos/UpdateSchemaMapping.dto.js';

export class UpdateSchemaMappingUseCase {
  constructor(private datasetRepository: DatasetRepository) {}

  async execute(input: UpdateSchemaMappingInput): Promise<{ datasetId: string }> {
    // 1. Validation - Metadata
    if (!input.meta.name || input.meta.name.trim().length === 0) {
      throw new MappingValidationError(
        'El nombre del report es obligatorio',
        'MISSING_NAME'
      );
    }
    
    if (input.meta.name.length > 100) {
      throw new MappingValidationError(
        'El nombre del report no puede exceder 100 caracteres',
        'NAME_TOO_LONG'
      );
    }
    
    // 2. Validation - Schema Mapping
    if (!input.schemaMapping.dimensionField) {
      throw new MappingValidationError(
        'Debes seleccionar al menos una columna como Dimensión (Eje X)',
        'MISSING_DIMENSION'
      );
    }

    if (input.schemaMapping.kpiFields.length < MappingRules.MIN_KPIS) {
      throw new MappingValidationError(
        'Debes seleccionar al menos un KPI numérico',
        'MISSING_KPI'
      );
    }

    if (input.dashboardLayout.highlightedKpis.length > MappingRules.MAX_HIGHLIGHTED_KPIS) {
      throw new MappingValidationError(
        `Solo puedes destacar hasta ${MappingRules.MAX_HIGHLIGHTED_KPIS} KPIs en tarjetas`,
        'TOO_MANY_HIGHLIGHTED'
      );
    }
    
    // 3. Validation - AI Config (if enabled)
    if (input.aiConfig?.enabled && input.aiConfig.userContext) {
      if (input.aiConfig.userContext.length > 500) {
        throw new MappingValidationError(
          'El contexto de IA no puede exceder 500 caracteres',
          'AI_CONTEXT_TOO_LONG'
        );
      }
    }

    // 4. Fetch existing dataset
    const dataset = await this.datasetRepository.findById(input.datasetId);
    if (!dataset) {
      throw new Error('Dataset no encontrado');
    }

    // 5. Update entity with all configuration
    dataset.meta = input.meta;
    dataset.schemaMapping = input.schemaMapping;
    dataset.dashboardLayout = input.dashboardLayout;
    dataset.aiConfig = input.aiConfig;
    dataset.status = 'ready'; // Mark as complete

    // 6. Persist
    await this.datasetRepository.update(dataset);

    return { datasetId: dataset.id };
  }
}
```

### 3.3 Presentation Layer (`modules/datasets/presentation`)

#### API Endpoint

```typescript
// modules/datasets/presentation/routes/datasets.routes.ts

// PATCH /api/v1/datasets/:id/mapping
router.patch('/:id/mapping', authMiddleware, async (req, res, next) => {
  try {
    const datasetId = req.params.id;
    const mappingData = req.body; // Validated via Zod schema

    const useCase = new UpdateSchemaMappingUseCase(datasetRepository);
    const result = await useCase.execute({ datasetId, ...mappingData });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error); // Handled by errorHandler middleware
  }
});
```

#### Validation Schema (Zod)

```typescript
// modules/datasets/presentation/schemas/updateMapping.schema.ts

import { z } from 'zod';

export const UpdateMappingSchema = z.object({
  meta: z.object({
    name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
    description: z.string().max(500).optional(),
  }),
  schemaMapping: z.object({
    dimensionField: z.string().min(1, 'Dimensión requerida'),
    dateField: z.string().optional(),
    kpiFields: z.array(
      z.object({
        id: z.string(),
        columnName: z.string(),
        label: z.string(),
        format: z.enum(['number', 'currency', 'percentage']),
      })
    ).min(1, 'Debes seleccionar al menos un KPI'),
    categoricalFields: z.array(z.string()).optional(),
  }),
  dashboardLayout: z.object({
    templateId: z.literal('sideby_executive'),
    highlightedKpis: z.array(z.string()).max(4, 'Máximo 4 KPIs destacados'),
  }),
  aiConfig: z.object({
    enabled: z.boolean(),
    userContext: z.string().max(500).optional(),
  }).optional(),
});
```

### 3.4 Infrastructure Layer (No Changes Needed)

The `DatasetRepository` already has `update()` method from RFC-002.

---

## 4. Frontend Specification (`apps/client`)

### 4.0 Feature Flag Configuration

**Location:** `apps/client/src/config/features.ts`

```typescript
// Global feature flags
export const FEATURES = {
  AI_ENABLED: import.meta.env.VITE_FEATURE_AI_ENABLED === 'true' || false,
  // Future flags...
} as const;

export type FeatureFlags = typeof FEATURES;
```

**Environment Variable:** `.env`
```bash
# Enable AI prompt functionality in ConfigurationStep
VITE_FEATURE_AI_ENABLED=false  # Set to 'true' to enable
```

**Usage in Components:**
```typescript
import { FEATURES } from '@/config/features';

// In ConfigurationStep.tsx
{FEATURES.AI_ENABLED && (
  <div>
    {/* AI Configuration UI */}
  </div>
)}
```

### 4.1 Components Overview

**Location:** `apps/client/src/features/dataset/`

The wizard consists of multiple steps managed by a parent container:

#### Wizard Components

1. **ColumnMappingStep.tsx** (Step 2)
   - **Location:** `components/wizard/ColumnMappingStep.tsx`
   - **Responsibilities:**
     - Display dimension field selector
     - List KPI fields with add/remove functionality
     - Show format selection per KPI (number, currency, percentage)
     - Validate at least 1 dimension + 1 KPI selected
   - **Reference:** Uses design from `SideBy-Design/src/pages/DataMappingWizard.tsx`

2. **ConfigurationStep.tsx** (Step 3)
   - **Location:** `components/wizard/ConfigurationStep.tsx`
   - **Responsibilities:**
     - Capture report name (required, max 100 chars)
     - Show AI prompt textarea (only if `FEATURE_AI_ENABLED = true`)
     - Display comprehensive summary preview:
       - File A & B info (name, rows, period detection)
       - Unified dataset metrics (total rows, dimension, KPIs)
       - Selected KPIs list with formats
     - Validate name is filled before allowing submission
     - Submit complete configuration via `PATCH /api/v1/datasets/:id`
     - Navigate to `/datasets/:id/dashboard` on success
   - **Reference:** Uses design from `SideBy-Design/src/pages/DataFinishWizard.tsx`

3. **Parent Page** (Not specified in RFC, assume WizardContainer or DatasetWizard)
   - Manages step transitions and shared state
   - Uses `useWizardState` hook for state management

#### State Management

**Hook:** `useWizardState`

**Location:** `apps/client/src/features/dataset/hooks/useWizardState.ts`

The wizard state is managed by a centralized hook that already exists. It handles:
- File upload state (fileA, fileB, parsedData)
- Mapping configuration (dimensionField, kpiFields)
- Metadata (name, description)
- AI configuration (enabled, userContext)

**Key Methods:**
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

### 4.2 Step 2: ColumnMappingStep Implementation

**Already exists:** `apps/client/src/features/dataset/components/wizard/ColumnMappingStep.tsx`

**Key Features:**
- Displays dimension field selector
- Shows list of KPI fields with add/remove buttons
- Each KPI has:
  - Column selector (from available columns)
  - Label input
  - Format selector (number, currency, percentage)
- Validates:
  - At least 1 dimension selected
  - At least 1 KPI configured

**Visual Reference:** `SideBy-Design/src/pages/DataMappingWizard.tsx`

**TDD Focus:**
- Test auto-classification logic (if implemented)
- Test validation rules (min 1 dimension, min 1 KPI)
- Test add/remove KPI functionality

### 4.3 Step 3: ConfigurationStep Implementation

**Location:** `apps/client/src/features/dataset/components/wizard/ConfigurationStep.tsx`

**Responsibilities:**

1. **Report Metadata Form**
   ```tsx
   // Report Name (Required)
   <Input
     value={metadata.name}
     onChange={(e) => setMetadata({ name: e.target.value })}
     placeholder="Ej: Ventas Q1 2024 vs Q1 2023"
     maxLength={100}
     required
   />
   // Character counter: {metadata.name.length}/100
   
   // Description field - Show like optional from UI
   // (kept in data model as optional)
   ```

2. **AI Configuration (Feature Flag Controlled)**
   ```tsx
   import { FEATURES } from '@/config/features';
   
   {FEATURES.AI_ENABLED && (
     <Card>
       <Toggle
         checked={aiConfig.enabled}
         onChange={(enabled) => setAIConfig({ enabled })}
       />
       
       {aiConfig.enabled && (
         <Textarea
           value={aiConfig.userContext}
           onChange={(e) => setAIConfig({ userContext: e.target.value })}
           placeholder="Ej: Analiza esto como un CFO buscando optimizar costos..."
           maxLength={500}
         />
       )}
     </Card>
   )}
   ```

3. **Comprehensive Summary Preview**
   
   Based on `SideBy-Design/src/pages/DataFinishWizard.tsx`, show:
   
   ```tsx
   // Success Icon & Message
   <CheckCircle2 className="h-20 w-20 text-success" />
   <h1>¡Datos Unificados Correctamente!</h1>
   
   // File A & B Cards (side-by-side)
   <Card variant="primary-border">
     <FileIcon />
     <div>
       <p>Archivo A: {fileA.name}</p>
       <Badge>{fileA.rowCount} filas</Badge>
       <Badge>{detectedPeriodA}</Badge> {/* e.g., "Ene 2024 - Mar 2024" */}
     </div>
   </Card>
   
   <Card variant="comparative-border">
     <FileIcon />
     <div>
       <p>Archivo B: {fileB.name}</p>
       <Badge>{fileB.rowCount} filas</Badge>
       <Badge>{detectedPeriodB}</Badge>
     </div>
   </Card>
   
   // Unified Dataset Metrics
   <Card>
     <h2>Dataset Unificado</h2>
     <div className="grid grid-cols-4 gap-4">
       <div>
         <Hash icon />
         <p>Total de Filas</p>
         <h3>{fileA.rowCount + fileB.rowCount}</h3>
       </div>
       <div>
         <Calendar icon />
         <p>Columna de Fecha</p>
         <h3>{mapping.dateField || 'N/A'}</h3>
       </div>
       <div>
         <BarChart3 icon />
         <p>KPIs Configurados</p>
         <h3>{mapping.kpiFields.length}</h3>
       </div>
       <div>
         <Layers icon />
         <p>Campo Dimensión</p>
         <h3>{mapping.dimensionField}</h3>
       </div>
     </div>
     
     // KPI List
     <div>
       <h3>KPIs Seleccionados:</h3>
       {mapping.kpiFields.map((kpi) => (
         <Badge key={kpi.id}>
           {kpi.label} ({kpi.format})
         </Badge>
       ))}
     </div>
   </Card>
   ```

4. **Final Validation & Submit**
   ```tsx
   const handleFinish = async () => {
     // Validate report name
     if (!metadata.name || metadata.name.trim().length === 0) {
       toast.error('El nombre del report es obligatorio');
       return;
     }
     
     // Prepare payload
     const payload = {
       meta: {
         name: metadata.name,
         description: metadata.description || undefined, // Show like optional from UI
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
       aiConfig: FEATURES.AI_ENABLED ? aiConfig : undefined,
     };
     
     // Submit
     const response = await fetch(`/api/v1/datasets/${datasetId}`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload),
     });
     
     if (response.ok) {
       navigate(`/datasets/${datasetId}/dashboard`);
     }
   };
   ```

**Visual Reference:** `SideBy-Design/src/pages/DataFinishWizard.tsx`

**TDD Focus:**
- Test name validation (required, max 100 chars)
- Test AI prompt validation (max 500 chars, only if enabled)
- Test summary calculations (total rows, period detection)
- Test payload construction
- Test navigation after successful submit
```

---

## 5. Testing Strategy (TDD)

### 5.1 Backend Tests

**Location:** `apps/api/src/modules/datasets/__tests__/UpdateSchemaMappingUseCase.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateSchemaMappingUseCase } from '../application/use-cases/UpdateSchemaMappingUseCase';
import { InMemoryDatasetRepository } from '../infrastructure/InMemoryDatasetRepository';
import { MappingValidationError } from '../domain/mapping.rules';

describe('UpdateSchemaMappingUseCase', () => {
  let useCase: UpdateSchemaMappingUseCase;
  let repository: InMemoryDatasetRepository;

  beforeEach(() => {
    repository = new InMemoryDatasetRepository();
    useCase = new UpdateSchemaMappingUseCase(repository);

    // Seed dataset
    repository.create({
      id: 'dataset-1',
      ownerId: 'user-1',
      status: 'processing',
      /* ... */
    });
  });

  it('should throw error if no dimension is selected', async () => {
    const input = {
      datasetId: 'dataset-1',
      schemaMapping: {
        dimensionField: '', // ❌ Empty
        kpiFields: [{ id: 'ventas', label: 'Ventas', format: 'currency', highlighted: true }],
      },
      dashboardLayout: { templateId: 'sideby_executive', highlightedKpis: ['ventas'] },
    };

    await expect(useCase.execute(input)).rejects.toThrow(MappingValidationError);
  });

  it('should throw error if no KPI is selected', async () => {
    const input = {
      datasetId: 'dataset-1',
      schemaMapping: {
        dimensionField: 'fecha',
        kpiFields: [], // ❌ Empty
      },
      dashboardLayout: { templateId: 'sideby_executive', highlightedKpis: [] },
    };

    await expect(useCase.execute(input)).rejects.toThrow(MappingValidationError);
  });

  it('should throw error if more than 4 KPIs are highlighted', async () => {
    const input = {
      datasetId: 'dataset-1',
      schemaMapping: {
        dimensionField: 'fecha',
        kpiFields: [
          { id: 'kpi1', label: 'KPI 1', format: 'number', highlighted: true },
          { id: 'kpi2', label: 'KPI 2', format: 'number', highlighted: true },
          { id: 'kpi3', label: 'KPI 3', format: 'number', highlighted: true },
          { id: 'kpi4', label: 'KPI 4', format: 'number', highlighted: true },
          { id: 'kpi5', label: 'KPI 5', format: 'number', highlighted: true }, // ❌ 5th
        ],
      },
      dashboardLayout: {
        templateId: 'sideby_executive',
        highlightedKpis: ['kpi1', 'kpi2', 'kpi3', 'kpi4', 'kpi5'],
      },
    };

    await expect(useCase.execute(input)).rejects.toThrow(MappingValidationError);
  });

  it('should update dataset status to "ready" on success', async () => {
    const input = {
      datasetId: 'dataset-1',
      schemaMapping: {
        dimensionField: 'fecha',
        kpiFields: [{ id: 'ventas', label: 'Ventas', format: 'currency', highlighted: true }],
      },
      dashboardLayout: { templateId: 'sideby_executive', highlightedKpis: ['ventas'] },
    };

    await useCase.execute(input);

    const updated = await repository.findById('dataset-1');
    expect(updated?.status).toBe('ready');
    expect(updated?.schemaMapping?.dimensionField).toBe('fecha');
  });
});
```

### 5.2 Frontend Tests

**Location:** `apps/client/src/features/dataset/__tests__/useSchemaMapping.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSchemaMapping } from '../hooks/useSchemaMapping';

// Mock fetch
global.fetch = vi.fn();

describe('useSchemaMapping', () => {
  it('should auto-classify first column as dimension', async () => {
    const mockDataset = {
      id: '1',
      data: [
        { fecha: '2024-01', ventas: 1500, _source_group: 'groupA' },
        { fecha: '2024-02', ventas: 1600, _source_group: 'groupA' },
      ],
      sourceConfig: { groupA: { label: 'A', color: '#000' } },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataset,
    });

    const { result } = renderHook(() => useSchemaMapping());

    await waitFor(() => {
      expect(result.current.mappings[0].role).toBe('dimension');
    });
  });

  it('should auto-classify numeric columns as KPIs', async () => {
    const mockDataset = {
      id: '1',
      data: [
        { fecha: '2024-01', ventas: 1500, _source_group: 'groupA' },
      ],
      sourceConfig: { groupA: { label: 'A', color: '#000' } },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataset,
    });

    const { result } = renderHook(() => useSchemaMapping());

    await waitFor(() => {
      const ventasMapping = result.current.mappings.find((m) => m.columnName === 'ventas');
      expect(ventasMapping?.role).toBe('numeric_kpi');
    });
  });
});
```

**Location:** `apps/client/src/features/dataset/__tests__/ColumnMappingCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnMappingCard } from '../components/ColumnMappingCard';

describe('ColumnMappingCard', () => {
  it('should display column name and auto-detected type', () => {
    const mapping = {
      columnName: 'ventas',
      role: 'numeric_kpi' as const,
      dataType: 'number' as const,
      label: 'Ventas',
      highlighted: false,
      isDateField: false,
    };

    render(<ColumnMappingCard mapping={mapping} onChange={vi.fn()} />);

    expect(screen.getByText('Columna: ventas')).toBeInTheDocument();
    expect(screen.getByText('🔢 Número')).toBeInTheDocument();
  });

  it('should call onChange when role is changed', () => {
    const onChange = vi.fn();
    const mapping = {
      columnName: 'pais',
      role: 'categorical' as const,
      dataType: 'string' as const,
      label: 'País',
      highlighted: false,
      isDateField: false,
    };

    render(<ColumnMappingCard mapping={mapping} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'dimension' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'dimension' })
    );
  });

  it('should show highlight checkbox only for numeric KPIs', () => {
    const mapping = {
      columnName: 'ventas',
      role: 'numeric_kpi' as const,
      dataType: 'number' as const,
      label: 'Ventas',
      highlighted: false,
      isDateField: false,
      format: 'currency' as const,
    };

    const { rerender } = render(
      <ColumnMappingCard mapping={mapping} onChange={vi.fn()} />
    );

    expect(screen.getByLabelText(/Destacar en KPI Card/)).toBeInTheDocument();

    // Change to categorical
    rerender(
      <ColumnMappingCard
        mapping={{ ...mapping, role: 'categorical' }}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryByLabelText(/Destacar en KPI Card/)).not.toBeInTheDocument();
  });
});
```

---

## 6. Security & Observability

### Security Checklist
- [x] **Authorization:** Only dataset owner can update mapping (validate `ownerId` in Backend).
- [x] **Input Validation:** Use Zod schema to validate `PATCH` request body.
- [x] **Rate Limiting:** Apply general API rate limit (already handled by global middleware).
- [x] **No Sensitive Data:** Mapping config contains no credentials or PII.

### Logging (Pino)
```typescript
// In UpdateSchemaMappingUseCase
logger.info({
  msg: 'Schema mapping updated',
  datasetId: input.datasetId,
  kpiCount: input.schemaMapping.kpiFields.length,
  highlightedCount: input.dashboardLayout.highlightedKpis.length,
});
```

---

## 7. Deployment & Migration

### Environment Variables

**New Variable Required:**
```bash
# Frontend (.env)
VITE_FEATURE_AI_ENABLED=false  # Set to 'true' to enable AI prompt functionality
```

### Database Migration
**No schema changes.** The `datasets` collection already supports optional `meta`, `schemaMapping`, `dashboardLayout`, and `aiConfig` fields (RFC-002).

### Rollout Plan
1. **Backend:** Deploy API changes (UpdateSchemaMappingUseCase + validation).
2. **Frontend:** Deploy feature flag config + wizard steps (ColumnMappingStep + ConfigurationStep).
3. **QA:** Run integration tests with complete wizard flow (Upload → Mapping → Config → Dashboard).
4. **Feature Flag:** Initially deploy with `VITE_FEATURE_AI_ENABLED=false`. Enable after AI backend is ready.

---

## 8. Alternatives Considered

### Alternative 1: Single-Step Mapping (No Configuration Step)
**Rejected.** Combining mapping + metadata + summary in one step creates cognitive overload. The 3-step wizard (Upload → Mapping → Configuration) provides better UX.

### Alternative 3: Always Show AI Prompt (No Feature Flag)
**Rejected.** AI backend may not be ready for MVP. Feature flag allows gradual rollout without frontend redeployment.

### Alternative 4: Auto-Detect Highlighted KPIs (First 4)
**Partially Accepted.** ConfigurationStep auto-selects first 4 KPIs for highlighting, but user cannot adjust this in MVP (future enhancement).

---

## 9. Success Metrics

- **UX Goal:** Users complete entire wizard (3 steps) in <3 minutes (average).
- **Error Rate:** <5% validation errors at Step 3 submission.
- **Technical Goal:** Mapping save latency <500ms (p95).
- **Test Coverage:** Backend >95%, Frontend >85%.

---

## 10. Next Steps (After Approval)

### Implementation Order (TDD Approach)

1. **@Backend MERN Agent:** [TESTS FIRST]
   - Write failing tests for `UpdateSchemaMappingUseCase` (name validation, AI validation, etc.)
   - Implement Use Case to pass tests
   - Write failing integration tests for `PATCH /api/v1/datasets/:id`
   - Implement endpoint + Zod schema
   - Run all tests: `npm run test`

2. **@Frontend MERN Agent:** [TESTS FIRST]
   - Create `config/features.ts` with `FEATURE_AI_ENABLED`
   - Write failing tests for `ColumnMappingStep` (dimension validation, KPI add/remove)
   - Implement ColumnMappingStep component
   - Write failing tests for `ConfigurationStep` (name validation, summary display, feature flag)
   - Implement ConfigurationStep component
   - Run all tests: `npm run test`

3. **@Architect:**
   - Review TDD compliance (tests written before implementation?)
   - Conduct end-to-end integration test:
     - Upload sample CSVs (RFC-002)
     - Complete ColumnMappingStep (RFC-003)
     - Complete ConfigurationStep with AI disabled
     - Verify dataset status = 'ready'
     - Navigate to dashboard
   - Update CHANGELOG with RFC-003 completion
   - Prepare RFC-004 (Dashboard Visualization) if needed

---

## Appendix A: Visual References

- **Step 2 (Mapping):** `SideBy-Design/src/pages/DataMappingWizard.tsx`
  - KPI selection UI pattern
  - Format selectors (currency, percentage, number)

- **Step 3 (Configuration):** `SideBy-Design/src/pages/DataFinishWizard.tsx`
  - Success message with icon
  - File A/B summary cards
  - Unified dataset metrics
  - KPI badges

---

## Appendix B: Related RFCs

- **RFC-002:** Data Ingestion (Prerequisite)
- **RFC-004:** Dashboard Visualization (Future - Depends on this RFC)
- **RFC-005:** AI Insights Generation (Future - AI backend)

---

**END OF RFC-003**
