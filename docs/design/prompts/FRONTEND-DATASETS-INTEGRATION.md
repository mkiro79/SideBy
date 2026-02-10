# Frontend Implementation Prompt: Datasets Integration

**Target Agent:** @Frontend React Specialist  
**Date:** 2026-02-09  
**Status:** Ready for Implementation  
**Prerequisites:** Backend Datasets Module MUST be implemented first (see `BACKEND-DATASETS-MODULE.md`)  
**TDD Required:** ✅ Yes (Component tests + Integration tests)

---

## 📋 MISSION BRIEFING

You are tasked with **refactoring the existing Dataset Upload Wizard** to integrate with the newly implemented Backend API. The current wizard sends all data in a single POST request. You will split this into two phases:

1. **Phase 1:** Upload files → Backend creates dataset (status='processing')
2. **Phase 2:** Configure mapping → Backend updates dataset (status='ready')

### What You'll Build

- ✅ **Refactor DataUploadWizard** to use new 2-phase flow
- ✅ **Create custom hooks** for API integration (`useDatasetUpload`, `useDatasetMapping`)
- ✅ **Update types** to match backend contracts
- ✅ **Add error handling** and loading states
- ✅ **Implement tests** for the new flow
- ✅ **Create Dashboard page** to render datasets

---

## 🏗️ PROJECT STRUCTURE

**Base Path:** `solution-sideby/apps/client/src/features/dataset/`

```
dataset/
├── pages/
│   ├── DataUploadWizard.tsx        # REFACTOR: Split into 2-phase flow
│   └── DatasetDashboard.tsx        # NEW: Render dataset with template
│
├── components/
│   └── wizard/
│       ├── FileUploadStep.tsx      # REFACTOR: Add upload logic
│       ├── ColumnMappingStep.tsx   # Keep as-is (local state)
│       └── ConfigurationStep.tsx   # REFACTOR: Add PATCH logic
│
├── hooks/
│   ├── useDatasetUpload.ts         # NEW: POST /datasets
│   ├── useDatasetMapping.ts        # NEW: PATCH /datasets/:id
│   ├── useDataset.ts               # NEW: GET /datasets/:id
│   └── useDatasetsList.ts          # NEW: GET /datasets
│
├── types/
│   ├── dataset.types.ts            # UPDATE: Match backend DTOs
│   └── api.types.ts                # NEW: API request/response types
│
├── services/
│   └── datasets.api.ts             # NEW: API client functions
│
└── __tests__/
    ├── DataUploadWizard.integration.test.tsx
    └── hooks/
        └── useDatasetUpload.test.ts
```

---

## 📖 BACKEND API CONTRACTS

### 1. POST /api/v1/datasets - Upload Files

**Request:**
```typescript
// multipart/form-data (NOT JSON)
const formData = new FormData();
formData.append('fileA', file1);  // File object
formData.append('fileB', file2);  // File object
```

**Response:**
```typescript
{
  success: true,
  data: {
    datasetId: string;        // "65a1b2c3d4e5f6789abcdef0"
    status: 'processing';
    rowCount: number;
    groupA: {
      fileName: string;
      rowCount: number;
    };
    groupB: {
      fileName: string;
      rowCount: number;
    };
  }
}
```

**Headers:**
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>'
}
```

---

### 2. PATCH /api/v1/datasets/:id - Configure Mapping

**Request:**
```typescript
{
  meta: {
    name: string;              // Required, max 100 chars
    description?: string;      // Optional, max 500 chars
  };
  
  schemaMapping: {
    dimensionField: string;
    dateField?: string;
    kpiFields: Array<{
      id: string;
      columnName: string;
      label: string;
      format: 'number' | 'currency' | 'percentage';
    }>;
    categoricalFields?: string[];
  };
  
  dashboardLayout: {
    templateId: 'sideby_executive';
    highlightedKpis: string[];  // Max 4 KPI IDs
  };
  
  aiConfig?: {
    enabled: boolean;
    userContext?: string;       // Max 500 chars
  };
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    datasetId: string;
    status: 'ready';
  }
}
```

---

### 3. GET /api/v1/datasets/:id - Get Dataset

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    ownerId: string;
    status: 'processing' | 'ready' | 'error';
    
    meta: {
      name: string;
      description?: string;
      createdAt: string;      // ISO 8601
      updatedAt: string;
    };
    
    sourceConfig: {
      groupA: {
        label: string;
        color: string;
        originalFileName: string;
        rowCount: number;
      };
      groupB: {
        label: string;
        color: string;
        originalFileName: string;
        rowCount: number;
      };
    };
    
    schemaMapping?: {
      dimensionField: string;
      dateField?: string;
      kpiFields: Array<{
        id: string;
        columnName: string;
        label: string;
        format: string;
      }>;
      categoricalFields?: string[];
    };
    
    dashboardLayout?: {
      templateId: string;
      highlightedKpis: string[];
    };
    
    aiConfig?: {
      enabled: boolean;
      userContext?: string;
      lastAnalysis?: string;
    };
    
    data: Array<{
      _source_group: 'groupA' | 'groupB';
      [key: string]: any;
    }>;
  }
}
```

---

### 4. GET /api/v1/datasets - List Datasets

**Response:**
```typescript
{
  success: true,
  data: Array<{
    id: string;
    status: string;
    meta: {
      name: string;
      createdAt: string;
    };
    sourceConfig: {
      groupA: { fileName: string };
      groupB: { fileName: string };
    };
    // NOTE: 'data' field is EXCLUDED in list endpoint
  }>;
  total: number;
}
```

---

### 5. DELETE /api/v1/datasets/:id - Delete Dataset

**Response:**
```typescript
{
  success: true;
  message: string;
}
```

---

## 🔧 IMPLEMENTATION STEPS

### PHASE 1: Update Types

**File:** `features/dataset/types/api.types.ts` (NEW)

```typescript
// Request types
export interface UploadFilesRequest {
  fileA: File;
  fileB: File;
}

export interface UpdateMappingRequest {
  meta: {
    name: string;
    description?: string;
  };
  schemaMapping: {
    dimensionField: string;
    dateField?: string;
    kpiFields: Array<{
      id: string;
      columnName: string;
      label: string;
      format: 'number' | 'currency' | 'percentage';
    }>;
    categoricalFields?: string[];
  };
  dashboardLayout: {
    templateId: 'sideby_executive';
    highlightedKpis: string[];
  };
  aiConfig?: {
    enabled: boolean;
    userContext?: string;
  };
}

// Response types
export interface UploadFilesResponse {
  success: boolean;
  data: {
    datasetId: string;
    status: 'processing';
    rowCount: number;
    groupA: {
      fileName: string;
      rowCount: number;
    };
    groupB: {
      fileName: string;
      rowCount: number;
    };
  };
}

export interface UpdateMappingResponse {
  success: boolean;
  data: {
    datasetId: string;
    status: 'ready';
  };
}

export interface DataRow {
  _source_group: 'groupA' | 'groupB';
  [key: string]: string | number | boolean;
}

export interface Dataset {
  id: string;
  ownerId: string;
  status: 'processing' | 'ready' | 'error';
  meta: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  sourceConfig: {
    groupA: {
      label: string;
      color: string;
      originalFileName: string;
      rowCount: number;
    };
    groupB: {
      label: string;
      color: string;
      originalFileName: string;
      rowCount: number;
    };
  };
  schemaMapping?: {
    dimensionField: string;
    dateField?: string;
    kpiFields: Array<{
      id: string;
      columnName: string;
      label: string;
      format: 'number' | 'currency' | 'percentage';
    }>;
    categoricalFields?: string[];
  };
  dashboardLayout?: {
    templateId: string;
    highlightedKpis: string[];
  };
  aiConfig?: {
    enabled: boolean;
    userContext?: string;
    lastAnalysis?: string;
  };
  data: DataRow[];
}

export interface ApiError {
  success: false;
  error: string;
}
```

**File:** `features/dataset/types/dataset.types.ts` (UPDATE)

Replace existing interfaces with imports from `api.types.ts`:

```typescript
export type { Dataset, DataRow, ApiError } from './api.types.js';

// Keep wizard-specific types
export interface WizardState {
  currentStep: 1 | 2 | 3;
  datasetId: string | null;  // NEW: Store datasetId from Phase 1
  
  // Phase 1: File upload
  fileA: {
    file: File | null;
    parsedData: ParsedFileData | null;
    error: FileValidationError | null;
  };
  fileB: {
    file: File | null;
    parsedData: ParsedFileData | null;
    error: FileValidationError | null;
  };
  
  // Phase 2: Mapping (local state, sent in PATCH)
  mapping: {
    dimensionField: string | null;
    dateField: string | null;
    kpiFields: KPIMappingField[];
    categoricalFields?: string[];
  };
  
  // Phase 2: Metadata
  metadata: {
    name: string;
    description: string;
  };
  
  aiConfig: {
    enabled: boolean;
    userContext: string;
  };
}
```

---

### PHASE 2: Create API Service

**File:** `features/dataset/services/datasets.api.ts` (NEW)

```typescript
import { 
  UploadFilesRequest, 
  UploadFilesResponse,
  UpdateMappingRequest,
  UpdateMappingResponse,
  Dataset,
  ApiError 
} from '../types/api.types.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Obtiene el token JWT del localStorage o contexto de autenticación
 */
function getAuthToken(): string {
  const token = localStorage.getItem('authToken'); // Ajusta según tu estrategia de auth
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
}

/**
 * POST /api/v1/datasets - Upload files and create dataset
 */
export async function uploadFiles(
  request: UploadFilesRequest
): Promise<UploadFilesResponse> {
  const formData = new FormData();
  formData.append('fileA', request.fileA);
  formData.append('fileB', request.fileB);
  
  const response = await fetch(`${API_URL}/api/v1/datasets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: formData
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error((data as ApiError).error || 'Error uploading files');
  }
  
  return data as UploadFilesResponse;
}

/**
 * PATCH /api/v1/datasets/:id - Update mapping configuration
 */
export async function updateMapping(
  datasetId: string,
  request: UpdateMappingRequest
): Promise<UpdateMappingResponse> {
  const response = await fetch(`${API_URL}/api/v1/datasets/${datasetId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error((data as ApiError).error || 'Error updating mapping');
  }
  
  return data as UpdateMappingResponse;
}

/**
 * GET /api/v1/datasets/:id - Get dataset by ID
 */
export async function getDataset(datasetId: string): Promise<Dataset> {
  const response = await fetch(`${API_URL}/api/v1/datasets/${datasetId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error((data as ApiError).error || 'Error loading dataset');
  }
  
  return data.data as Dataset;
}

/**
 * GET /api/v1/datasets - List all user's datasets
 */
export async function listDatasets(): Promise<Dataset[]> {
  const response = await fetch(`${API_URL}/api/v1/datasets`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error((data as ApiError).error || 'Error loading datasets');
  }
  
  return data.data as Dataset[];
}

/**
 * DELETE /api/v1/datasets/:id - Delete dataset
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/datasets/${datasetId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error((data as ApiError).error || 'Error deleting dataset');
  }
}
```

---

### PHASE 3: Create Custom Hooks

**File:** `features/dataset/hooks/useDatasetUpload.ts` (NEW)

**TDD Test First:** `__tests__/hooks/useDatasetUpload.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDatasetUpload } from '../useDatasetUpload';

describe('useDatasetUpload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should upload files successfully', async () => {
    const fileA = new File(['content'], 'fileA.csv', { type: 'text/csv' });
    const fileB = new File(['content'], 'fileB.csv', { type: 'text/csv' });
    
    const { result } = renderHook(() => useDatasetUpload());
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          datasetId: 'test-id-123',
          status: 'processing',
          rowCount: 100
        }
      })
    });
    
    const response = await result.current.upload({ fileA, fileB });
    
    expect(response.datasetId).toBe('test-id-123');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle upload errors', async () => {
    const fileA = new File([''], 'empty.csv');
    const fileB = new File([''], 'empty.csv');
    
    const { result } = renderHook(() => useDatasetUpload());
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Files too large'
      })
    });
    
    await expect(result.current.upload({ fileA, fileB }))
      .rejects.toThrow('Files too large');
  });
});
```

**Implementation:**

```typescript
import { useState } from 'react';
import { uploadFiles } from '../services/datasets.api.js';
import type { UploadFilesRequest, UploadFilesResponse } from '../types/api.types.js';

export function useDatasetUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (request: UploadFilesRequest): Promise<UploadFilesResponse['data']> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await uploadFiles(request);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return {
    upload,
    isLoading,
    error,
    reset
  };
}
```

---

**File:** `features/dataset/hooks/useDatasetMapping.ts` (NEW)

```typescript
import { useState } from 'react';
import { updateMapping } from '../services/datasets.api.js';
import type { UpdateMappingRequest, UpdateMappingResponse } from '../types/api.types.js';

export function useDatasetMapping() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (
    datasetId: string,
    request: UpdateMappingRequest
  ): Promise<UpdateMappingResponse['data']> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await updateMapping(datasetId, request);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return {
    update,
    isLoading,
    error,
    reset
  };
}
```

---

**File:** `features/dataset/hooks/useDataset.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';
import { getDataset } from '../services/datasets.api.js';
import type { Dataset } from '../types/api.types.js';

export function useDataset(datasetId: string | null) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getDataset(id);
      setDataset(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (datasetId) {
      load(datasetId);
    }
  }, [datasetId]);

  const reload = () => {
    if (datasetId) {
      load(datasetId);
    }
  };

  return {
    dataset,
    isLoading,
    error,
    reload
  };
}
```

---

### PHASE 4: Refactor DataUploadWizard

**File:** `features/dataset/pages/DataUploadWizard.tsx` (MAJOR REFACTOR)

**Key Changes:**
1. Remove `unifyDatasets` call (backend does this)
2. Split `handleSubmit` into two handlers:
   - `handleFileUpload()` → POST /datasets (Step 1)
   - `handleConfigureMapping()` → PATCH /datasets/:id (Step 3)
3. Store `datasetId` in wizard state
4. Remove `unifiedData` from payload

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatasetUpload } from '../hooks/useDatasetUpload.js';
import { useDatasetMapping } from '../hooks/useDatasetMapping.js';
import { toast } from '@/components/ui/use-toast.js';

export default function DataUploadWizard() {
  const navigate = useNavigate();
  const { upload, isLoading: isUploading } = useDatasetUpload();
  const { update, isLoading: isUpdating } = useDatasetMapping();
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  
  // ... existing state (fileA, fileB, mapping, metadata, aiConfig)
  
  /**
   * PHASE 1: Upload files (Step 1 → Step 2 transition)
   */
  const handleFileUpload = async () => {
    if (!fileA.file || !fileB.file) {
      toast.error('Debes seleccionar ambos archivos');
      return;
    }
    
    try {
      const result = await upload({
        fileA: fileA.file,
        fileB: fileB.file
      });
      
      // Store datasetId for Phase 2
      setDatasetId(result.datasetId);
      
      toast.success('Archivos subidos exitosamente');
      
      // Advance to Step 2 (Mapping)
      setCurrentStep(2);
    } catch (error) {
      toast.error('Error al subir archivos');
      console.error(error);
    }
  };
  
  /**
   * PHASE 2: Configure mapping (Step 3 finalization)
   */
  const handleConfigureMapping = async () => {
    if (!datasetId) {
      toast.error('Error: No se encontró el dataset');
      return;
    }
    
    if (!metadata.name || !mapping.dimensionField || !mapping.kpiFields?.length) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    
    try {
      const payload = {
        meta: {
          name: metadata.name,
          description: metadata.description || undefined
        },
        schemaMapping: {
          dimensionField: mapping.dimensionField,
          dateField: mapping.dateField || undefined,
          kpiFields: mapping.kpiFields.map(kpi => ({
            id: kpi.id,
            columnName: kpi.columnName,
            label: kpi.label,
            format: kpi.format
          })),
          categoricalFields: mapping.categoricalFields
        },
        dashboardLayout: {
          templateId: 'sideby_executive' as const,
          highlightedKpis: mapping.kpiFields
            .filter(kpi => kpi.highlighted)
            .slice(0, 4)
            .map(kpi => kpi.id)
        },
        aiConfig: aiConfig.enabled ? {
          enabled: true,
          userContext: aiConfig.userContext || undefined
        } : undefined
      };
      
      await update(datasetId, payload);
      
      toast.success('Dataset configurado exitosamente');
      
      // Navigate to dashboard
      navigate(`/datasets/${datasetId}/dashboard`);
    } catch (error) {
      toast.error('Error al configurar el dataset');
      console.error(error);
    }
  };
  
  return (
    <div>
      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <FileUploadStep
          fileA={fileA}
          fileB={fileB}
          onFileChange={handleFileChange}
          onNext={handleFileUpload}
          isLoading={isUploading}
        />
      )}
      
      {/* Step 2: Column Mapping */}
      {currentStep === 2 && (
        <ColumnMappingStep
          mapping={mapping}
          onMappingChange={setMapping}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}
      
      {/* Step 3: Configuration & Review */}
      {currentStep === 3 && (
        <ConfigurationStep
          metadata={metadata}
          aiConfig={aiConfig}
          mapping={mapping}
          onMetadataChange={setMetadata}
          onAIConfigChange={setAIConfig}
          onFinish={handleConfigureMapping}
          onBack={() => setCurrentStep(2)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
```

---

### PHASE 5: Create Dashboard Page

**File:** `features/dataset/pages/DatasetDashboard.tsx` (NEW)

```typescript
import { useParams } from 'react-router-dom';
import { useDataset } from '../hooks/useDataset.js';
import { Loader2 } from 'lucide-react';

export default function DatasetDashboard() {
  const { id } = useParams<{ id: string }>();
  const { dataset, isLoading, error } = useDataset(id || null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!dataset) {
    return null;
  }
  
  // Render dashboard based on templateId
  const { dashboardLayout, schemaMapping, data, sourceConfig } = dataset;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{dataset.meta.name}</h1>
      
      {/* Render based on template */}
      {dashboardLayout?.templateId === 'sideby_executive' && (
        <>
          {/* KPI Cards Section */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {dashboardLayout.highlightedKpis.map(kpiId => {
              const kpi = schemaMapping?.kpiFields.find(k => k.id === kpiId);
              if (!kpi) return null;
              
              return (
                <KPICard 
                  key={kpiId}
                  kpi={kpi}
                  data={data}
                  sourceConfig={sourceConfig}
                />
              );
            })}
          </div>
          
          {/* Main Chart */}
          <div className="mb-8">
            <MainChart 
              data={data}
              dimensionField={schemaMapping?.dimensionField || ''}
              kpiFields={schemaMapping?.kpiFields || []}
            />
          </div>
          
          {/* Data Table */}
          <DataTable 
            data={data}
            schemaMapping={schemaMapping}
          />
        </>
      )}
    </div>
  );
}
```

---

## 🧪 INTEGRATION TESTS

**File:** `features/dataset/__tests__/DataUploadWizard.integration.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DataUploadWizard from '../pages/DataUploadWizard';

describe('DataUploadWizard Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.setItem('authToken', 'test-token');
  });

  it('should complete full wizard flow with backend integration', async () => {
    // Mock Phase 1: Upload files
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            datasetId: 'test-dataset-123',
            status: 'processing',
            rowCount: 50
          }
        })
      })
      // Mock Phase 2: Update mapping
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            datasetId: 'test-dataset-123',
            status: 'ready'
          }
        })
      });
    
    render(
      <BrowserRouter>
        <DataUploadWizard />
      </BrowserRouter>
    );
    
    // Step 1: Upload files
    const fileA = new File(['data'], 'fileA.csv', { type: 'text/csv' });
    const fileB = new File(['data'], 'fileB.csv', { type: 'text/csv' });
    
    const inputA = screen.getByLabelText(/archivo a/i);
    const inputB = screen.getByLabelText(/archivo b/i);
    
    fireEvent.change(inputA, { target: { files: [fileA] } });
    fireEvent.change(inputB, { target: { files: [fileB] } });
    
    const uploadButton = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(uploadButton);
    
    // Wait for Phase 1 to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/datasets'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
    
    // Step 2 & 3: Configure mapping (simplified)
    // ... add mapping configuration tests
    
    const finishButton = screen.getByRole('button', { name: /finalizar/i });
    fireEvent.click(finishButton);
    
    // Wait for Phase 2 to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/v1/datasets/test-dataset-123'),
        expect.objectContaining({
          method: 'PATCH'
        })
      );
    });
  });
});
```

---

## ✅ DEFINITION OF DONE

Before marking this task complete, ensure:

### Functionality
- [ ] Files upload successfully via POST /datasets
- [ ] DatasetId is stored and passed to PATCH endpoint
- [ ] Mapping configuration updates successfully
- [ ] Navigation to dashboard works after completion
- [ ] Error handling displays user-friendly messages
- [ ] Loading states shown during async operations

### Code Quality
- [ ] All TypeScript types match backend contracts
- [ ] No ESLint errors
- [ ] Component tests pass
- [ ] Integration tests pass
- [ ] Hooks follow React best practices

### User Experience
- [ ] Toast notifications for success/error states
- [ ] Loading spinners during API calls
- [ ] Form validation prevents invalid submissions
- [ ] Back button works in wizard
- [ ] Dashboard renders dataset correctly

### Documentation
- [ ] JSDoc comments in Spanish for complex logic
- [ ] API service functions documented
- [ ] Hook usage examples in comments

---

## 🚨 CRITICAL REMINDERS

1. **DO NOT send `unifiedData`** in the wizard payload anymore
2. **DO NOT call `unifyDatasets()`** in the frontend (backend does this)
3. **ALWAYS include Authorization header** with JWT token
4. **Store datasetId** after Phase 1 to use in Phase 2
5. **Handle 401 errors** by redirecting to login
6. **Validate form fields** before API calls
7. **Use TypeScript strict mode** - no `any` types

---

## 📦 ENVIRONMENT VARIABLES

Add to `.env`:

```bash
VITE_API_URL=http://localhost:3000
```

For production:

```bash
VITE_API_URL=https://api.sideby.com
```

---

## 🎯 EXECUTION ORDER

1. **Phase 1:** Update types (`api.types.ts`, `dataset.types.ts`)
2. **Phase 2:** Create API service (`datasets.api.ts`)
3. **Phase 3:** Create hooks (TDD: tests first, then implementation)
4. **Phase 4:** Refactor wizard (split into 2-phase flow)
5. **Phase 5:** Create dashboard page
6. **Phase 6:** Integration tests
7. **Phase 7:** Manual testing with real backend

---

## 🔗 INTEGRATION CHECKLIST

Verify these work end-to-end:

- [ ] Upload 2 CSV files → Creates dataset in backend
- [ ] Configure mapping → Updates dataset status to 'ready'
- [ ] Navigate to dashboard → Loads dataset with all data
- [ ] KPI cards show correct calculations
- [ ] Chart renders with _source_group colors
- [ ] Table shows all rows with group labels
- [ ] Delete dataset → Removes from backend
- [ ] List datasets → Shows user's datasets only

---

**Good luck, Frontend Agent! Build a seamless integration.** 💪

---

**Version:** 1.0  
**Last Updated:** 2026-02-09  
**Estimated Effort:** 6-8 hours  
**Dependencies:** Backend Datasets Module (BACKEND-DATASETS-MODULE.md)
