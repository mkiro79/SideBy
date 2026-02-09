# [RFC-002] Data Ingestion Module (File Upload & Validation)

| Metadata | Details |
| :--- | :--- |
| **Author** | SideBy Team |
| **Status** | **Ready for Dev** |
| **Date** | 2026-02-07 |
| **Scope** | `apps/api/src/modules/datasets`, `apps/client/src/features/dataset` |
| **Based on** | UC-CORE-01: Carga de Archivos (Data Ingestion) |
| **Reviewers** | @Architect, @Backend, @Frontend |

---

## 1. Context & Scope

### Problem Statement
Users need to upload CSV/Excel files to compare datasets side-by-side. The system must validate file size, format, structure, and security before processing. This is the **core value proposition** of SideBy: "Compare Smarter, Decide Faster".

### Goals
- Enable users to upload **two files** (Dataset A vs Dataset B) for comparison.
- Validate files against business rules (size, format, structure, headers).
- Store validated data in MongoDB with proper schema mapping.
- Provide clear, actionable error feedback to users.

### Non-Goals (Out of Scope)
- Real-time streaming of large files (>50K rows).
- Integration with external data sources (APIs, databases).
- Automatic data cleaning or imputation.

---

## 2. Proposed Solution (Architecture)

### High-Level Flow

```
┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
│  Frontend   │                 │   Backend   │                 │  MongoDB    │
│  (Wizard)   │                 │   (API)     │                 │  (Storage)  │
└──────┬──────┘                 └──────┬──────┘                 └──────┬──────┘
       │                               │                               │
       │ 1. User selects 2 files      │                               │
       │    (CSV/Excel)                │                               │
       ├──────────────────────────────>│                               │
       │ POST /api/v1/datasets/upload  │                               │
       │ FormData: fileA, fileB,       │                               │
       │           name, description    │                               │
       │                               │                               │
       │                               │ 2. Validate files:            │
       │                               │    - Size (max 2MB each)      │
       │                               │    - Format (CSV/Excel)       │
       │                               │    - Structure (min 2 cols)   │
       │                               │    - Headers match            │
       │                               │    - No malicious content     │
       │                               │                               │
       │                               │ 3. Parse files to JSON        │
       │                               │    (Papa Parse / XLSX)        │
       │                               │                               │
       │                               │ 4. Create Dataset entity      │
       │                               │    with status: "processing"  │
       │                               ├─────────────────────────────>│
       │                               │ db.datasets.insertOne()       │
       │                               │                               │
       │<──────────────────────────────┤                               │
       │ 201 Created                   │                               │
       │ { datasetId, status }         │                               │
       │                               │                               │
       │ 5. Navigate to mapping wizard │                               │
       │    /datasets/mapping/:id      │                               │
       └───────────────────────────────┘                               │
```

### Key Components

#### Backend (`apps/api`)
- **Module:** `datasets`
- **Layers:**
  - **Domain:** `Dataset` entity, `ValidationRules`.
  - **Application:** `UploadDatasetUseCase`, `ValidateFileUseCase`.
  - **Infrastructure:** `FileParserService`, `DatasetRepository`.
  - **Presentation:** `DatasetsController` (Multer for file upload).

#### Frontend (`apps/client`)
- **Feature:** `dataset/pages/DataUploadWizard`
- **Components:** `FileDropZone`, `FileValidationFeedback`, `UploadProgress`.
- **Hooks:** `useFileUpload`, `useFileValidator`.

---

## 3. Backend Specification (`apps/api`)

### 3.1 Domain Layer (`modules/datasets/domain`)

#### Entity: Dataset

```typescript
// Types auxiliares
export type DatasetStatus = 'processing' | 'ready' | 'error';

export interface KPIField {
  id: string;              // key en el objeto data
  label: string;
  format: 'number' | 'currency' | 'percentage';
}

export interface GroupConfig {
  label: string;
  color: string;           // Hex color for visualization
  originalFileName: string;
}

export interface DataRow {
  _source_group: 'groupA' | 'groupB';
  [key: string]: string | number | boolean; // Dynamic columns from CSV
}

// Entity Principal
export interface Dataset {
  id: string;
  ownerId: string;         // Reference to User
  status: DatasetStatus;
  
  meta: {
    name: string;
    description?: string;
    createdAt: Date;
  };

  sourceConfig: {
    groupA: GroupConfig;
    groupB: GroupConfig;
  };

  schemaMapping?: {        // Optional until mapping wizard completes
    dimensionField: string;
    kpiFields: KPIField[];
  };

  dashboardLayout?: {
    templateId: string;
    highlightedKpis: string[];
    rows: any[];
  };

  aiConfig?: {
    enabled: boolean;
    userContext?: string;
    lastAnalysis?: string;
  };

  data: DataRow[];         // Unified data array (max ~50K rows)
}
```

#### Domain Rules (Validation Business Logic)

```typescript
// modules/datasets/domain/validation.rules.ts

export const ValidationRules = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_FORMATS: ['.csv', '.xlsx', '.xls'],
  MIN_COLUMNS: 2,
  MIN_ROWS: 1,
  
  // Plan-based limits
  LIMITS: {
    free: {
      maxDatasets: 3,
      maxRowsPerFile: 10000,
    },
    pro: {
      maxDatasets: Infinity,
      maxRowsPerFile: 50000,
    },
  },
};

export class FileValidationError extends Error {
  constructor(
    message: string,
    public code: 'SIZE_EXCEEDED' | 'INVALID_FORMAT' | 'STRUCTURE_INVALID' | 'HEADERS_MISMATCH' | 'MALICIOUS_CONTENT'
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}
```

### 3.2 Application Layer (`modules/datasets/application`)

#### Use Case: UploadDatasetUseCase

```typescript
// modules/datasets/application/use-cases/UploadDatasetUseCase.ts

import { Dataset } from '../../domain/Dataset.js';
import { ValidationRules, FileValidationError } from '../../domain/validation.rules.js';

export interface UploadDatasetInput {
  ownerId: string;
  name: string;
  description?: string;
  fileA: Express.Multer.File;
  fileB: Express.Multer.File;
  userPlan: 'free' | 'pro';
}

export interface UploadDatasetOutput {
  datasetId: string;
  status: 'processing';
}

export class UploadDatasetUseCase {
  constructor(
    private fileParser: FileParserService,
    private datasetRepo: DatasetRepository,
    private userRepo: UserRepository
  ) {}

  async execute(input: UploadDatasetInput): Promise<UploadDatasetOutput> {
    // 1. Validate file sizes
    this.validateFileSize(input.fileA);
    this.validateFileSize(input.fileB);

    // 2. Validate file formats
    this.validateFileFormat(input.fileA);
    this.validateFileFormat(input.fileB);

    // 3. Check user's dataset limit based on plan
    await this.checkUserLimits(input.ownerId, input.userPlan);

    // 4. Parse files to JSON
    const dataA = await this.fileParser.parse(input.fileA);
    const dataB = await this.fileParser.parse(input.fileB);

    // 5. Validate structure (min columns, min rows)
    this.validateStructure(dataA);
    this.validateStructure(dataB);

    // 6. Validate headers match
    this.validateHeadersMatch(dataA.headers, dataB.headers);

    // 7. Check row count limits based on plan
    this.validateRowCount(dataA.rows.length, input.userPlan);
    this.validateRowCount(dataB.rows.length, input.userPlan);

    // 8. Create Dataset entity with unified data
    const dataset: Dataset = {
      id: generateId(),
      ownerId: input.ownerId,
      status: 'processing',
      meta: {
        name: input.name,
        description: input.description,
        createdAt: new Date(),
      },
      sourceConfig: {
        groupA: {
          label: 'Dataset A',
          color: '#2563EB', // Blue
          originalFileName: input.fileA.originalname,
        },
        groupB: {
          label: 'Dataset B',
          color: '#F97316', // Orange
          originalFileName: input.fileB.originalname,
        },
      },
      data: this.unifyData(dataA.rows, dataB.rows),
    };

    // 9. Save to DB
    await this.datasetRepo.create(dataset);

    return {
      datasetId: dataset.id,
      status: 'processing',
    };
  }

  private validateFileSize(file: Express.Multer.File): void {
    if (file.size > ValidationRules.MAX_FILE_SIZE) {
      throw new FileValidationError(
        `El archivo "${file.originalname}" excede el tamaño máximo de 2MB`,
        'SIZE_EXCEEDED'
      );
    }
  }

  private validateFileFormat(file: Express.Multer.File): void {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ValidationRules.ALLOWED_FORMATS.includes(ext)) {
      throw new FileValidationError(
        `Formato no soportado: ${ext}. Solo se permiten CSV y Excel`,
        'INVALID_FORMAT'
      );
    }
  }

  private validateStructure(parsedData: ParsedFile): void {
    if (parsedData.headers.length < ValidationRules.MIN_COLUMNS) {
      throw new FileValidationError(
        'El archivo debe tener al menos 2 columnas',
        'STRUCTURE_INVALID'
      );
    }
    if (parsedData.rows.length < ValidationRules.MIN_ROWS) {
      throw new FileValidationError(
        'El archivo debe tener al menos 1 fila de datos',
        'STRUCTURE_INVALID'
      );
    }
  }

  private validateHeadersMatch(headersA: string[], headersB: string[]): void {
    if (headersA.length !== headersB.length) {
      throw new FileValidationError(
        'Los archivos deben tener el mismo número de columnas',
        'HEADERS_MISMATCH'
      );
    }
    
    const mismatch = headersA.find((h, i) => h !== headersB[i]);
    if (mismatch) {
      throw new FileValidationError(
        `Las cabeceras deben coincidir. Diferencia encontrada: "${mismatch}"`,
        'HEADERS_MISMATCH'
      );
    }
  }

  private validateRowCount(rowCount: number, plan: 'free' | 'pro'): void {
    const limit = ValidationRules.LIMITS[plan].maxRowsPerFile;
    if (rowCount > limit) {
      throw new FileValidationError(
        `El archivo excede el límite de ${limit.toLocaleString()} filas para el plan ${plan}`,
        'STRUCTURE_INVALID'
      );
    }
  }

  private async checkUserLimits(userId: string, plan: 'free' | 'pro'): Promise<void> {
    const datasetsCount = await this.datasetRepo.countByOwner(userId);
    const limit = ValidationRules.LIMITS[plan].maxDatasets;
    
    if (datasetsCount >= limit) {
      throw new Error(`Has alcanzado el límite de ${limit} datasets para el plan ${plan}`);
    }
  }

  private unifyData(rowsA: any[], rowsB: any[]): DataRow[] {
    const unifiedA = rowsA.map(row => ({ ...row, _source_group: 'groupA' as const }));
    const unifiedB = rowsB.map(row => ({ ...row, _source_group: 'groupB' as const }));
    return [...unifiedA, ...unifiedB];
  }
}
```

### 3.3 Infrastructure Layer

#### FileParserService

```typescript
// modules/datasets/infrastructure/services/FileParserService.ts

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFile {
  headers: string[];
  rows: Record<string, any>[];
}

export class FileParserService {
  async parse(file: Express.Multer.File): Promise<ParsedFile> {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === '.csv') {
      return this.parseCSV(file);
    } else if (ext === '.xlsx' || ext === '.xls') {
      return this.parseExcel(file);
    }

    throw new Error('Unsupported format');
  }

  private async parseCSV(file: Express.Multer.File): Promise<ParsedFile> {
    const content = file.buffer.toString('utf-8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data as Record<string, any>[],
          });
        },
        error: (error) => reject(error),
      });
    });
  }

  private async parseExcel(file: Express.Multer.File): Promise<ParsedFile> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = data[0] as string[];
    const rows = data.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });

    return { headers, rows };
  }
}
```

#### DatasetRepository (Mongoose)

```typescript
// modules/datasets/infrastructure/repositories/DatasetRepository.ts

import { Dataset } from '../../domain/Dataset.js';
import { DatasetModel } from '../models/DatasetModel.js';

export class DatasetRepository {
  async create(dataset: Dataset): Promise<void> {
    await DatasetModel.create(dataset);
  }

  async findById(id: string): Promise<Dataset | null> {
    const doc = await DatasetModel.findById(id);
    return doc ? doc.toObject() : null;
  }

  async countByOwner(ownerId: string): Promise<number> {
    return DatasetModel.countDocuments({ ownerId });
  }

  async findByOwner(ownerId: string): Promise<Dataset[]> {
    const docs = await DatasetModel.find({ ownerId }).sort({ 'meta.createdAt': -1 });
    return docs.map(doc => doc.toObject());
  }
}
```

### 3.4 Presentation Layer (API Contract)

#### POST /api/v1/datasets/upload

**Request:**
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Headers:** `Authorization: Bearer <JWT>`
- **Body:**
  ```
  fileA: <File> (CSV/Excel, max 2MB)
  fileB: <File> (CSV/Excel, max 2MB)
  name: string (required)
  description: string (optional)
  ```

**Response:**

```json
// 201 Created
{
  "success": true,
  "data": {
    "datasetId": "507f1f77bcf86cd799439011",
    "status": "processing"
  }
}

// 400 Bad Request (Validation Error)
{
  "success": false,
  "error": {
    "code": "SIZE_EXCEEDED",
    "message": "El archivo \"ventas_2024.csv\" excede el tamaño máximo de 2MB"
  }
}

// 400 Bad Request (Headers Mismatch)
{
  "success": false,
  "error": {
    "code": "HEADERS_MISMATCH",
    "message": "Las cabeceras deben coincidir. Diferencia encontrada: \"fecha\""
  }
}

// 403 Forbidden (Quota Exceeded)
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Has alcanzado el límite de 3 datasets para el plan free"
  }
}
```

---

## 4. Frontend Specification (`apps/client`)

### 4.1 UX/UI Flow

#### Wizard Steps
1. **Step 1:** File Upload (`/datasets/upload`)
   - Drag & Drop zones for File A and File B
   - File preview (name, size)
   - Real-time validation feedback
   
2. **Step 2:** Metadata (`/datasets/upload` - same page)
   - Dataset name (required)
   - Description (optional)
   - Submit button

3. **Step 3:** Mapping (future) (`/datasets/mapping/:id`)
   - Column mapping interface

#### Visual Design (Tailwind 4 Variables)
- Use `bg-data-primary` for File A indicators
- Use `bg-data-comparative` for File B indicators
- Error states: `text-destructive`, `border-destructive`
- Success states: `text-data-success`, `border-data-success`

### 4.2 Feature Structure

```
src/features/dataset/pages/
  ├── DataUploadWizard.tsx          # Main page
  
src/features/dataset/components/
  ├── FileDropZone.tsx              # Drag & Drop component
  ├── FileValidationFeedback.tsx    # Displays errors
  ├── UploadProgress.tsx            # Progress bar
  
src/features/dataset/hooks/
  ├── useFileUpload.ts              # Handles API call
  ├── useFileValidator.ts           # Client-side validation
  
src/features/dataset/services/
  ├── datasetService.ts             # API client methods
```

### 4.3 Components Specification

#### FileDropZone Component

```typescript
interface FileDropZoneProps {
  label: 'A' | 'B';
  file: File | null;
  error: string | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

export const FileDropZone = ({ label, file, error, onFileSelect, onFileRemove }: FileDropZoneProps) => {
  // Implementación con react-dropzone
  // Validación client-side: size, format
  // Visual feedback: border color based on validation
};
```

#### useFileUpload Hook

```typescript
interface UseFileUploadReturn {
  uploadDataset: (payload: UploadPayload) => Promise<Dataset>;
  isLoading: boolean;
  error: string | null;
  progress: number; // 0-100
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadDataset = async (payload: UploadPayload) => {
    const formData = new FormData();
    formData.append('fileA', payload.fileA);
    formData.append('fileB', payload.fileB);
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);

    // Axios call with progress tracking
    const response = await datasetService.upload(formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
        setProgress(percentCompleted);
      },
    });

    return response.data;
  };

  return { uploadDataset, isLoading, error, progress };
};
```

### 4.4 Client-Side Validation

Before sending to API, validate:
- File size <= 2MB
- File extension is .csv, .xlsx, or .xls
- Both files are selected
- Dataset name is not empty

Display errors immediately in UI (no server roundtrip needed).

### 4.5 State Management (Zustand)

```typescript
// features/dataset/store/uploadWizard.store.ts

interface UploadWizardState {
  fileA: File | null;
  fileB: File | null;
  name: string;
  description: string;
  currentStep: 1 | 2 | 3;
  
  setFileA: (file: File | null) => void;
  setFileB: (file: File | null) => void;
  setMetadata: (name: string, description: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useUploadWizardStore = create<UploadWizardState>((set) => ({
  fileA: null,
  fileB: null,
  name: '',
  description: '',
  currentStep: 1,
  
  setFileA: (file) => set({ fileA: file }),
  setFileB: (file) => set({ fileB: file }),
  setMetadata: (name, description) => set({ name, description }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) as any })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) as any })),
  reset: () => set({ fileA: null, fileB: null, name: '', description: '', currentStep: 1 }),
}));
```

---

## 5. TDD Strategy (Test Scenarios)

### Backend Tests (Vitest)

#### Domain Layer
- ✅ `[ValidationRules]` should define correct limits for free and pro plans
- ✅ `[FileValidationError]` should have correct error codes

#### Use Case Layer
- ✅ `[UploadDatasetUseCase]` should throw SIZE_EXCEEDED if file > 2MB
- ✅ `[UploadDatasetUseCase]` should throw INVALID_FORMAT if file is .txt
- ✅ `[UploadDatasetUseCase]` should throw STRUCTURE_INVALID if file has < 2 columns
- ✅ `[UploadDatasetUseCase]` should throw HEADERS_MISMATCH if headers differ
- ✅ `[UploadDatasetUseCase]` should create dataset with status "processing"
- ✅ `[UploadDatasetUseCase]` should unify data with _source_group tags
- ✅ `[UploadDatasetUseCase]` should enforce dataset limits for free users

#### Infrastructure Layer
- ✅ `[FileParserService]` should parse CSV with headers correctly
- ✅ `[FileParserService]` should parse Excel (XLSX) with headers correctly
- ✅ `[DatasetRepository]` should save dataset to MongoDB

### Frontend Tests (Vitest + Testing Library)

#### Component Tests
- ✅ `[FileDropZone]` should display "arrastra archivos" message when empty
- ✅ `[FileDropZone]` should show error border when error prop is set
- ✅ `[FileDropZone]` should accept .csv and .xlsx files only
- ✅ `[FileDropZone]` should reject files > 2MB with client-side validation
- ✅ `[FileValidationFeedback]` should display error message when error exists

#### Hook Tests
- ✅ `[useFileUpload]` should set isLoading to true during upload
- ✅ `[useFileUpload]` should update progress from 0 to 100
- ✅ `[useFileUpload]` should set error message on API failure
- ✅ `[useFileValidator]` should validate file size correctly
- ✅ `[useFileValidator]` should validate file extension correctly

#### Integration Tests
- ✅ `[DataUploadWizard]` should enable submit only when both files are selected
- ✅ `[DataUploadWizard]` should navigate to /datasets/mapping/:id on success
- ✅ `[DataUploadWizard]` should display backend error messages

---

## 6. Security & Validation (OWASP Checklist)

### File Upload Security

#### ✅ Size Limits
- **Backend:** Enforce via Multer config: `limits: { fileSize: 2 * 1024 * 1024 }`
- **Frontend:** Client-side pre-check before upload

#### ✅ Format Validation
- **Backend:** Check file extension AND MIME type
- **Frontend:** Accept only `.csv,.xlsx,.xls` in file input

#### ✅ Malicious Content
- **CSV:** Use Papa Parse with `skipEmptyLines: true`, sanitize cell values
- **Excel:** Use XLSX library, avoid `eval()` on cell formulas
- **Reject files with macros** (check for `xl/macrosheets` in ZIP structure)

#### ✅ Input Sanitization
- Validate all user inputs (name, description) with Zod
- Strip HTML tags from text fields
- Use parameterized queries (Mongoose handles this)

#### ✅ Rate Limiting
- Limit upload endpoint: **3 requests per minute per user**
- Use `express-rate-limit` middleware

#### ✅ Authentication
- All dataset operations require valid JWT
- Verify `ownerId` matches authenticated user

#### ✅ Authorization
- Users can only access their own datasets
- Implement `DatasetOwnershipGuard` middleware

### Data Storage

#### ✅ Quota Enforcement
- Check user's plan limits BEFORE accepting upload
- Return `403 Forbidden` if quota exceeded

#### ✅ MongoDB Document Size
- Max document size: **16MB**
- For datasets > 50K rows, consider storing in GridFS (future enhancement)

---

## 7. Configuration Variables

### Environment Variables (Backend)

```bash
# File Upload
MAX_FILE_SIZE=2097152              # 2MB in bytes
ALLOWED_FILE_FORMATS=.csv,.xlsx,.xls

# Plan Limits
FREE_PLAN_MAX_DATASETS=3
FREE_PLAN_MAX_ROWS=10000
PRO_PLAN_MAX_DATASETS=999
PRO_PLAN_MAX_ROWS=50000

# Storage
UPLOAD_TEMP_DIR=/tmp/sideby-uploads
```

### Dependencies

#### Backend
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "papaparse": "^5.4.1",
    "xlsx": "^0.18.5",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11",
    "@types/papaparse": "^5.3.14"
  }
}
```

#### Frontend
```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",
    "axios": "^1.6.5"
  }
}
```

---

## 8. Alternatives Considered

### Why NOT use direct S3 upload?
- **Decision:** Store files in-memory, parse immediately, discard binary.
- **Reason:** Files are temporary (only needed for parsing). Storing parsed JSON in MongoDB is simpler and cheaper for MVP.
- **Future:** For files > 16MB, use GridFS or S3 + presigned URLs.

### Why validate headers match?
- **Decision:** Enforce strict header matching between File A and File B.
- **Reason:** Simplifies data comparison logic. Users must prepare files with same structure.
- **Alternative:** Allow fuzzy matching (future enhancement with manual column mapping).

### Why unified data array instead of separate collections?
- **Decision:** Store all rows in a single `data` array with `_source_group` tag.
- **Reason:** Simplifies querying and aggregation for comparisons. Mongo's 16MB limit is sufficient for 50K rows.

---

## 9. Migration & Deployment Plan

### Database Migration
- **New Collection:** `datasets`
- **Indexes:**
  - `{ ownerId: 1, "meta.createdAt": -1 }` (for user's datasets list)
  - `{ status: 1 }` (for background processing queries)

### Deployment Checklist
- [ ] Add environment variables to `.env.production`
- [ ] Create `/tmp/sideby-uploads` directory with write permissions
- [ ] Configure reverse proxy (Nginx) to allow `client_max_body_size 3M`
- [ ] Set up CORS to allow `multipart/form-data` requests
- [ ] Monitor disk usage (temp files cleanup cron job)

---

## 10. Success Metrics

### KPIs
- **Upload Success Rate:** > 95% (excluding user errors)
- **Average Upload Time:** < 5 seconds for 2MB files
- **Validation Error Rate:** < 10% (clear error messages reduce retries)

### Monitoring
- Log all upload attempts with file sizes, formats, and outcomes
- Alert on unusual patterns (many SIZE_EXCEEDED errors = users testing limits)
- Track quota exhaustion events (upsell opportunity)

---

## 11. Next Steps (Post-MVP)

1. **UC-CORE-02:** Mapping wizard (define which columns are KPIs vs dimensions)
2. **UC-CORE-03:** Visualization dashboard with A/B comparison charts
3. **UC-CORE-04:** AI-powered insights generation
4. **Advanced Validations:** Detect data types automatically, handle missing values
5. **Large File Support:** Streaming upload + background processing with job queue

---

## Appendix: Example Payloads

### Upload Request (curl)

```bash
curl -X POST http://localhost:3000/api/v1/datasets/upload \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -F "fileA=@ventas_2024.csv" \
  -F "fileB=@ventas_2023.csv" \
  -F "name=Q1 2024 vs Q1 2023 - Marketing" \
  -F "description=Comparativa de rendimiento de campañas"
```

### Dataset Document (MongoDB)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "ownerId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "status": "processing",
  "meta": {
    "name": "Q1 2024 vs Q1 2023 - Marketing",
    "description": "Comparativa de rendimiento de campañas",
    "createdAt": "2024-01-26T10:00:00.000Z"
  },
  "sourceConfig": {
    "groupA": {
      "label": "Dataset A",
      "color": "#2563EB",
      "originalFileName": "ventas_2024.csv"
    },
    "groupB": {
      "label": "Dataset B",
      "color": "#F97316",
      "originalFileName": "ventas_2023.csv"
    }
  },
  "data": [
    {
      "fecha": "2024-01-01",
      "pais": "España",
      "ingresos": 1500,
      "visitas": 300,
      "rebote": 0.45,
      "_source_group": "groupA"
    },
    {
      "fecha": "2024-01-01",
      "pais": "España",
      "ingresos": 1200,
      "visitas": 280,
      "rebote": 0.50,
      "_source_group": "groupB"
    }
  ]
}
```

---

**End of RFC-002**

This RFC is ready for implementation by @Backend and @Frontend agents following TDD methodology.
