# Backend Implementation Prompt: Datasets Module (CRUD + Mapping)

**Target Agent:** @Backend MERN Specialist  
**Date:** 2026-02-09  
**Status:** Ready for Implementation  
**TDD Required:** ✅ Yes (Red-Green-Refactor)

---

## 📋 MISSION BRIEFING

You are tasked with implementing the **Datasets Module** for the SideBy API, following **Clean Architecture**, **TDD**, and **SOLID** principles within a **Modular Monolith** structure.

### What You'll Build

A complete CRUD API for managing comparative datasets with:
- ✅ File upload and validation (CSV/Excel)
- ✅ Data unification with `_source_group` tagging
- ✅ Schema mapping configuration (dimensions, KPIs, formats)
- ✅ Dashboard layout configuration
- ✅ AI configuration (feature flag controlled)
- ✅ JWT authentication and ownership validation
- ✅ Rate limiting per user
- ✅ Row count validation (max 50k rows configurable)
- ✅ OpenAPI 3.0 documentation

---

## 🏗️ PROJECT STRUCTURE (STRICT)

**Base Path:** `solution-sideby/apps/api/src/modules/datasets/`

```
datasets/
├── domain/
│   ├── Dataset.entity.ts           # Core entity (Pure TypeScript)
│   ├── DatasetRepository.ts        # Repository interface
│   ├── validation.rules.ts         # Business rules & constants
│   └── errors/
│       ├── DatasetNotFoundError.ts
│       ├── MappingValidationError.ts
│       └── UnauthorizedAccessError.ts
│
├── application/
│   ├── dtos/
│   │   ├── CreateDataset.dto.ts
│   │   ├── UpdateMapping.dto.ts
│   │   └── DatasetResponse.dto.ts
│   └── use-cases/
│       ├── CreateDatasetUseCase.ts
│       ├── GetDatasetByIdUseCase.ts
│       ├── UpdateMappingUseCase.ts
│       ├── DeleteDatasetUseCase.ts
│       └── ListDatasetsUseCase.ts
│
├── infrastructure/
│   ├── mongoose/
│   │   ├── DatasetSchema.ts        # Mongoose schema
│   │   └── MongoDatasetRepository.ts
│   └── parsers/
│       ├── CsvParser.ts
│       └── DataUnifier.ts          # Adds _source_group tags
│
├── presentation/
│   ├── datasets.routes.ts          # Express routes
│   ├── datasets.controller.ts      # HTTP handlers
│   ├── datasets.swagger.ts         # OpenAPI specs
│   └── validators/
│       └── datasets.schemas.ts     # Zod validation schemas
│
└── __tests__/
    ├── unit/
    │   ├── CreateDatasetUseCase.test.ts
    │   ├── UpdateMappingUseCase.test.ts
    │   └── DataUnifier.test.ts
    └── integration/
        └── datasets.api.test.ts
```

---

## 📚 REQUIRED READING

Before implementing, review these documents:

1. **[RFC-002: Data Ingestion]** `docs/design/RFC-002-DATA_INGESTION.md`
   - Data structure with `_source_group` tags
   - File validation rules
   
2. **[RFC-003: Schema Mapping]** `docs/design/RFC-003-SCHEMA_MAPPING.md`
   - Mapping configuration structure
   - KPI field definitions
   - Dashboard layout
   
3. **[Use Cases]** `docs/UsesCases.md` (lines 140-250)
   - Dataset entity structure
   - DataRow interface with `_source_group`

4. **[Frontend Types]** `solution-sideby/apps/client/src/features/dataset/types/`
   - `dataset.types.ts` - Main interfaces
   - `wizard.types.ts` - Wizard payloads

---

## 🔐 SECURITY & MIDDLEWARE

### 1. JWT Authentication Middleware

**File:** `solution-sideby/apps/api/src/middleware/auth.middleware.ts`

**Reference Service:** `src/modules/auth/infrastructure/jwt-token.service.ts` already exists.

```typescript
import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '@/modules/auth/infrastructure/jwt-token.service.js';
import logger from '@/utils/logger.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
      return;
    }

    const token = authHeader.substring(7);
    const tokenService = new JwtTokenService();
    
    const decoded = tokenService.verify(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
      return;
    }

    // Attach user info to request
    req.userId = (decoded as any).userId || (decoded as any).sub;
    req.user = {
      id: req.userId,
      email: (decoded as any).email,
      name: (decoded as any).name
    };

    next();
  } catch (error) {
    logger.error({ err: error }, 'Auth middleware error');
    res.status(401).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
}
```

**TDD Test:** Verify token validation, expired tokens, missing tokens.

### 2. Rate Limiting Middleware

**File:** `solution-sideby/apps/api/src/middleware/rate-limit.middleware.ts`

Use `express-rate-limit` package:

```typescript
import rateLimit from 'express-rate-limit';

// Upload endpoint: Max 10 uploads per hour per user
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intenta de nuevo en una hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.userId || req.ip
});

// Mapping endpoint: Max 50 updates per hour per user
export const mappingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'Demasiadas actualizaciones. Intenta de nuevo más tarde.'
  },
  keyGenerator: (req: any) => req.userId || req.ip
});
```

---

## 📐 DOMAIN LAYER

### Dataset Entity

**File:** `modules/datasets/domain/Dataset.entity.ts`

```typescript
export type DatasetStatus = 'processing' | 'ready' | 'error';

export interface GroupConfig {
  label: string;
  color: string;
  originalFileName: string;
  rowCount: number;
}

export interface KPIField {
  id: string;              // Unique ID (e.g., "kpi_1234567890")
  columnName: string;      // Column name from CSV
  label: string;           // User-friendly label
  format: 'number' | 'currency' | 'percentage';
}

export interface DataRow {
  _source_group: 'groupA' | 'groupB';
  [key: string]: string | number | boolean;
}

export interface Dataset {
  id: string;
  ownerId: string;         // User ID from JWT
  status: DatasetStatus;
  
  meta: {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  sourceConfig: {
    groupA: GroupConfig;
    groupB: GroupConfig;
  };

  schemaMapping?: {
    dimensionField: string;
    dateField?: string;
    kpiFields: KPIField[];
    categoricalFields?: string[];
  };

  dashboardLayout?: {
    templateId: 'sideby_executive';
    highlightedKpis: string[];  // Max 4 KPI IDs
  };

  aiConfig?: {
    enabled: boolean;
    userContext?: string;
    lastAnalysis?: string;
  };

  data: DataRow[];           // Unified data with _source_group tags
}
```

### Validation Rules

**File:** `modules/datasets/domain/validation.rules.ts`

```typescript
export const DatasetRules = {
  // File validation
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_EXTENSIONS: ['.csv', '.xlsx', '.xls'],
  
  // Row limits (configurable via env)
  MAX_ROWS: parseInt(process.env.DATASET_MAX_ROWS || '50000', 10),
  MIN_ROWS: 1,
  
  // Mapping validation
  MIN_DIMENSIONS: 1,
  MIN_KPIS: 1,
  MAX_HIGHLIGHTED_KPIS: 4,
  
  // Metadata validation
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_AI_CONTEXT_LENGTH: 500,
} as const;

export class DatasetValidationError extends Error {
  constructor(
    message: string,
    public code: 
      | 'INVALID_FILE_FORMAT'
      | 'FILE_TOO_LARGE'
      | 'TOO_MANY_ROWS'
      | 'HEADERS_MISMATCH'
      | 'MISSING_DIMENSION'
      | 'MISSING_KPI'
      | 'TOO_MANY_HIGHLIGHTED'
      | 'INVALID_NAME'
      | 'INVALID_AI_CONTEXT'
  ) {
    super(message);
    this.name = 'DatasetValidationError';
  }
}
```

### Repository Interface

**File:** `modules/datasets/domain/DatasetRepository.ts`

```typescript
import { Dataset } from './Dataset.entity.js';

export interface DatasetRepository {
  create(dataset: Omit<Dataset, 'id'>): Promise<Dataset>;
  findById(id: string): Promise<Dataset | null>;
  findByOwnerId(ownerId: string): Promise<Dataset[]>;
  update(id: string, updates: Partial<Dataset>): Promise<Dataset>;
  delete(id: string): Promise<void>;
  
  // Cleanup method for abandoned datasets
  findAbandoned(cutoffDate: Date): Promise<Dataset[]>;
}
```

---

## 💼 APPLICATION LAYER

### DTOs

**File:** `modules/datasets/application/dtos/CreateDataset.dto.ts`

```typescript
export interface CreateDatasetInput {
  ownerId: string;           // From JWT
  fileA: {
    buffer: Buffer;
    originalName: string;
    mimetype: string;
    size: number;
  };
  fileB: {
    buffer: Buffer;
    originalName: string;
    mimetype: string;
    size: number;
  };
  groupALabel?: string;      // Default: "Grupo A"
  groupBLabel?: string;      // Default: "Grupo B"
}

export interface CreateDatasetOutput {
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
}
```

**File:** `modules/datasets/application/dtos/UpdateMapping.dto.ts`

```typescript
export interface UpdateMappingInput {
  datasetId: string;
  ownerId: string;           // From JWT (for ownership validation)
  
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

export interface UpdateMappingOutput {
  datasetId: string;
  status: 'ready';
}
```

### Use Cases (TDD Required)

#### 1. CreateDatasetUseCase

**File:** `modules/datasets/application/use-cases/CreateDatasetUseCase.ts`

**TDD Test File:** `modules/datasets/__tests__/unit/CreateDatasetUseCase.test.ts`

**Test Cases (Write FIRST before implementation):**
```typescript
describe('CreateDatasetUseCase', () => {
  // ❌ RED: Validation errors
  it('should throw error if file A is not CSV/Excel', async () => {});
  it('should throw error if file B is not CSV/Excel', async () => {});
  it('should throw error if file size exceeds 10MB', async () => {});
  it('should throw error if headers do not match between files', async () => {});
  it('should throw error if total rows exceed MAX_ROWS', async () => {});
  it('should throw error if files have no data rows', async () => {});
  
  // ✅ GREEN: Successful creation
  it('should create dataset with status=processing', async () => {});
  it('should unify data with _source_group tags', async () => {});
  it('should store sourceConfig with original filenames', async () => {});
  it('should return datasetId and row counts', async () => {});
});
```

**Implementation Requirements:**
1. Validate file formats (CSV, XLSX, XLS)
2. Validate file sizes (max 10MB each)
3. Parse both files (use Papa Parse or similar)
4. Validate headers match exactly
5. Validate total rows ≤ MAX_ROWS
6. Unify data:
   ```typescript
   const unifiedData = [
     ...parsedA.rows.map(row => ({ ...row, _source_group: 'groupA' })),
     ...parsedB.rows.map(row => ({ ...row, _source_group: 'groupB' }))
   ];
   ```
7. Create dataset entity with status='processing'
8. Persist to repository
9. Return datasetId + metadata

**Error Codes to Use:**
- `INVALID_FILE_FORMAT`
- `FILE_TOO_LARGE`
- `TOO_MANY_ROWS`
- `HEADERS_MISMATCH`

---

#### 2. UpdateMappingUseCase

**File:** `modules/datasets/application/use-cases/UpdateMappingUseCase.ts`

**TDD Test File:** `modules/datasets/__tests__/unit/UpdateMappingUseCase.test.ts`

**Test Cases (Write FIRST):**
```typescript
describe('UpdateMappingUseCase', () => {
  // ❌ RED: Validation errors
  it('should throw error if dataset not found', async () => {});
  it('should throw error if ownerId does not match', async () => {});
  it('should throw error if name is empty', async () => {});
  it('should throw error if name exceeds 100 chars', async () => {});
  it('should throw error if no dimension selected', async () => {});
  it('should throw error if no KPIs selected', async () => {});
  it('should throw error if more than 4 KPIs highlighted', async () => {});
  it('should throw error if AI context exceeds 500 chars', async () => {});
  
  // ✅ GREEN: Successful update
  it('should update all configuration fields', async () => {});
  it('should change status from processing to ready', async () => {});
  it('should update updatedAt timestamp', async () => {});
  it('should return datasetId and new status', async () => {});
});
```

**Implementation Requirements:**
1. Fetch dataset by ID
2. Validate ownership (dataset.ownerId === input.ownerId)
3. Validate meta.name (required, max 100 chars)
4. Validate schemaMapping:
   - dimensionField is not empty
   - kpiFields.length >= 1
5. Validate dashboardLayout:
   - highlightedKpis.length <= 4
6. Validate aiConfig (if present):
   - userContext <= 500 chars
7. Update dataset fields
8. Set status = 'ready'
9. Update updatedAt = new Date()
10. Persist changes
11. Return success

**Error Codes to Use:**
- `MISSING_DIMENSION`
- `MISSING_KPI`
- `TOO_MANY_HIGHLIGHTED`
- `INVALID_NAME`
- `INVALID_AI_CONTEXT`

---

#### 3. GetDatasetByIdUseCase

**File:** `modules/datasets/application/use-cases/GetDatasetByIdUseCase.ts`

**Test Cases:**
```typescript
describe('GetDatasetByIdUseCase', () => {
  it('should throw error if dataset not found', async () => {});
  it('should throw error if ownerId does not match', async () => {});
  it('should return full dataset if ownership valid', async () => {});
  it('should include all data rows', async () => {});
});
```

**Implementation:**
1. Fetch dataset by ID
2. Throw NotFoundError if not exists
3. Validate ownership
4. Return full dataset

---

#### 4. ListDatasetsUseCase

**Test Cases:**
```typescript
describe('ListDatasetsUseCase', () => {
  it('should return only datasets owned by user', async () => {});
  it('should return empty array if no datasets', async () => {});
  it('should sort by createdAt DESC', async () => {});
  it('should include metadata but exclude data rows', async () => {});
});
```

**Implementation:**
1. Fetch all datasets by ownerId
2. Sort by createdAt DESC
3. Exclude `data` field (too large for list view)
4. Return array

---

#### 5. DeleteDatasetUseCase

**Test Cases:**
```typescript
describe('DeleteDatasetUseCase', () => {
  it('should throw error if dataset not found', async () => {});
  it('should throw error if ownerId does not match', async () => {});
  it('should delete dataset successfully', async () => {});
});
```

**Implementation:**
1. Fetch dataset
2. Validate ownership
3. Delete from repository

---

## 🔌 INFRASTRUCTURE LAYER

### Mongoose Schema

**File:** `modules/datasets/infrastructure/mongoose/DatasetSchema.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { Dataset } from '../../domain/Dataset.entity.js';

export interface DatasetDocument extends Omit<Dataset, 'id'>, Document {}

const GroupConfigSchema = new Schema({
  label: { type: String, required: true },
  color: { type: String, required: true },
  originalFileName: { type: String, required: true },
  rowCount: { type: Number, required: true }
}, { _id: false });

const KPIFieldSchema = new Schema({
  id: { type: String, required: true },
  columnName: { type: String, required: true },
  label: { type: String, required: true },
  format: { 
    type: String, 
    enum: ['number', 'currency', 'percentage'],
    required: true 
  }
}, { _id: false });

const DatasetSchema = new Schema<DatasetDocument>({
  ownerId: { 
    type: String, 
    required: true,
    index: true  // For fast queries by owner
  },
  status: { 
    type: String, 
    enum: ['processing', 'ready', 'error'],
    default: 'processing',
    index: true
  },
  
  meta: {
    name: { type: String, required: false },  // Optional until Step 3
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  
  sourceConfig: {
    groupA: { type: GroupConfigSchema, required: true },
    groupB: { type: GroupConfigSchema, required: true }
  },
  
  schemaMapping: {
    dimensionField: { type: String },
    dateField: { type: String },
    kpiFields: [KPIFieldSchema],
    categoricalFields: [{ type: String }]
  },
  
  dashboardLayout: {
    templateId: { type: String },
    highlightedKpis: [{ type: String }]
  },
  
  aiConfig: {
    enabled: { type: Boolean, default: false },
    userContext: { type: String },
    lastAnalysis: { type: String }
  },
  
  data: [{ type: Schema.Types.Mixed }]  // Flexible array for CSV data
}, {
  timestamps: true,
  collection: 'datasets'
});

// Index for cleanup job (find abandoned datasets)
DatasetSchema.index({ status: 1, 'meta.createdAt': 1 });

export const DatasetModel = mongoose.model<DatasetDocument>('Dataset', DatasetSchema);
```

### Repository Implementation

**File:** `modules/datasets/infrastructure/mongoose/MongoDatasetRepository.ts`

```typescript
import { DatasetRepository } from '../../domain/DatasetRepository.js';
import { Dataset } from '../../domain/Dataset.entity.js';
import { DatasetModel } from './DatasetSchema.js';

export class MongoDatasetRepository implements DatasetRepository {
  async create(dataset: Omit<Dataset, 'id'>): Promise<Dataset> {
    const doc = new DatasetModel(dataset);
    await doc.save();
    return this.mapToEntity(doc);
  }

  async findById(id: string): Promise<Dataset | null> {
    const doc = await DatasetModel.findById(id);
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Dataset[]> {
    const docs = await DatasetModel.find({ ownerId })
      .sort({ 'meta.createdAt': -1 })
      .select('-data'); // Exclude data for list view
    return docs.map(doc => this.mapToEntity(doc));
  }

  async update(id: string, updates: Partial<Dataset>): Promise<Dataset> {
    const doc = await DatasetModel.findByIdAndUpdate(
      id,
      { ...updates, 'meta.updatedAt': new Date() },
      { new: true }
    );
    if (!doc) throw new Error('Dataset not found');
    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await DatasetModel.findByIdAndDelete(id);
  }

  async findAbandoned(cutoffDate: Date): Promise<Dataset[]> {
    const docs = await DatasetModel.find({
      status: 'processing',
      'meta.createdAt': { $lt: cutoffDate }
    });
    return docs.map(doc => this.mapToEntity(doc));
  }

  private mapToEntity(doc: any): Dataset {
    return {
      id: doc._id.toString(),
      ownerId: doc.ownerId,
      status: doc.status,
      meta: doc.meta,
      sourceConfig: doc.sourceConfig,
      schemaMapping: doc.schemaMapping,
      dashboardLayout: doc.dashboardLayout,
      aiConfig: doc.aiConfig,
      data: doc.data || []
    };
  }
}
```

---

## 🌐 PRESENTATION LAYER

### Routes

**File:** `modules/datasets/presentation/datasets.routes.ts`

```typescript
import { Router } from 'express';
import multer from 'multer';
import { DatasetsController } from './datasets.controller.js';
import { authMiddleware } from '@/middleware/auth.middleware.js';
import { uploadRateLimiter, mappingRateLimiter } from '@/middleware/rate-limit.middleware.js';

const router = Router();
const controller = new DatasetsController();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 2
  }
});

// All routes require authentication
router.use(authMiddleware);

// POST /api/v1/datasets - Create dataset (upload files)
router.post(
  '/',
  uploadRateLimiter,
  upload.fields([
    { name: 'fileA', maxCount: 1 },
    { name: 'fileB', maxCount: 1 }
  ]),
  controller.createDataset.bind(controller)
);

// GET /api/v1/datasets - List user's datasets
router.get(
  '/',
  controller.listDatasets.bind(controller)
);

// GET /api/v1/datasets/:id - Get specific dataset
router.get(
  '/:id',
  controller.getDatasetById.bind(controller)
);

// PATCH /api/v1/datasets/:id - Update mapping configuration
router.patch(
  '/:id',
  mappingRateLimiter,
  controller.updateMapping.bind(controller)
);

// DELETE /api/v1/datasets/:id - Delete dataset
router.delete(
  '/:id',
  controller.deleteDataset.bind(controller)
);

export default router;
```

### Controller

**File:** `modules/datasets/presentation/datasets.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/middleware/auth.middleware.js';
import { CreateDatasetUseCase } from '../application/use-cases/CreateDatasetUseCase.js';
import { GetDatasetByIdUseCase } from '../application/use-cases/GetDatasetByIdUseCase.js';
import { UpdateMappingUseCase } from '../application/use-cases/UpdateMappingUseCase.js';
import { DeleteDatasetUseCase } from '../application/use-cases/DeleteDatasetUseCase.js';
import { ListDatasetsUseCase } from '../application/use-cases/ListDatasetsUseCase.js';
import { MongoDatasetRepository } from '../infrastructure/mongoose/MongoDatasetRepository.js';
import { 
  CreateDatasetSchema, 
  UpdateMappingSchema 
} from './validators/datasets.schemas.js';
import logger from '@/utils/logger.js';

export class DatasetsController {
  private repository = new MongoDatasetRepository();

  async createDataset(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files?.fileA?.[0] || !files?.fileB?.[0]) {
        res.status(400).json({
          success: false,
          error: 'Debes subir ambos archivos (fileA y fileB)'
        });
        return;
      }

      const useCase = new CreateDatasetUseCase(this.repository);
      
      const result = await useCase.execute({
        ownerId: req.userId!,
        fileA: {
          buffer: files.fileA[0].buffer,
          originalName: files.fileA[0].originalname,
          mimetype: files.fileA[0].mimetype,
          size: files.fileA[0].size
        },
        fileB: {
          buffer: files.fileB[0].buffer,
          originalName: files.fileB[0].originalname,
          mimetype: files.fileB[0].mimetype,
          size: files.fileB[0].size
        }
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error({ err: error }, 'Error creating dataset');
      next(error);
    }
  }

  async getDatasetById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetDatasetByIdUseCase(this.repository);
      
      const dataset = await useCase.execute({
        datasetId: req.params.id,
        ownerId: req.userId!
      });

      res.status(200).json({
        success: true,
        data: dataset
      });
    } catch (error) {
      next(error);
    }
  }

  async listDatasets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new ListDatasetsUseCase(this.repository);
      
      const datasets = await useCase.execute({
        ownerId: req.userId!
      });

      res.status(200).json({
        success: true,
        data: datasets,
        total: datasets.length
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMapping(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body with Zod
      const validatedData = UpdateMappingSchema.parse(req.body);
      
      const useCase = new UpdateMappingUseCase(this.repository);
      
      const result = await useCase.execute({
        datasetId: req.params.id,
        ownerId: req.userId!,
        ...validatedData
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDataset(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new DeleteDatasetUseCase(this.repository);
      
      await useCase.execute({
        datasetId: req.params.id,
        ownerId: req.userId!
      });

      res.status(200).json({
        success: true,
        message: 'Dataset eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Zod Validation Schemas

**File:** `modules/datasets/presentation/validators/datasets.schemas.ts`

```typescript
import { z } from 'zod';
import { DatasetRules } from '../../domain/validation.rules.js';

export const UpdateMappingSchema = z.object({
  meta: z.object({
    name: z.string()
      .min(1, 'El nombre es obligatorio')
      .max(DatasetRules.MAX_NAME_LENGTH, `Máximo ${DatasetRules.MAX_NAME_LENGTH} caracteres`),
    description: z.string()
      .max(DatasetRules.MAX_DESCRIPTION_LENGTH)
      .optional()
  }),
  
  schemaMapping: z.object({
    dimensionField: z.string().min(1, 'Debes seleccionar una dimensión'),
    dateField: z.string().optional(),
    kpiFields: z.array(
      z.object({
        id: z.string(),
        columnName: z.string(),
        label: z.string(),
        format: z.enum(['number', 'currency', 'percentage'])
      })
    ).min(DatasetRules.MIN_KPIS, `Debes seleccionar al menos ${DatasetRules.MIN_KPIS} KPI`),
    categoricalFields: z.array(z.string()).optional()
  }),
  
  dashboardLayout: z.object({
    templateId: z.literal('sideby_executive'),
    highlightedKpis: z.array(z.string())
      .max(DatasetRules.MAX_HIGHLIGHTED_KPIS, `Máximo ${DatasetRules.MAX_HIGHLIGHTED_KPIS} KPIs destacados`)
  }),
  
  aiConfig: z.object({
    enabled: z.boolean(),
    userContext: z.string()
      .max(DatasetRules.MAX_AI_CONTEXT_LENGTH)
      .optional()
  }).optional()
});
```

---

## 📖 OPENAPI DOCUMENTATION

**File:** `modules/datasets/presentation/datasets.swagger.ts`

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     Dataset:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         ownerId:
 *           type: string
 *           example: "user_123"
 *         status:
 *           type: string
 *           enum: [processing, ready, error]
 *         meta:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Ventas Q1 2024 vs Q1 2023"
 *             description:
 *               type: string
 *             createdAt:
 *               type: string
 *               format: date-time
 *         sourceConfig:
 *           type: object
 *           properties:
 *             groupA:
 *               $ref: '#/components/schemas/GroupConfig'
 *             groupB:
 *               $ref: '#/components/schemas/GroupConfig'
 *     
 *     GroupConfig:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *           example: "Año Actual"
 *         color:
 *           type: string
 *           example: "#3b82f6"
 *         originalFileName:
 *           type: string
 *           example: "ventas_2024.csv"
 *         rowCount:
 *           type: integer
 *           example: 1500
 *     
 *     KPIField:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "kpi_1234567890"
 *         columnName:
 *           type: string
 *           example: "ventas"
 *         label:
 *           type: string
 *           example: "Ventas Totales"
 *         format:
 *           type: string
 *           enum: [number, currency, percentage]
 *     
 *     DataRow:
 *       type: object
 *       properties:
 *         _source_group:
 *           type: string
 *           enum: [groupA, groupB]
 *       additionalProperties: true
 *       example:
 *         _source_group: "groupA"
 *         fecha: "2024-01-01"
 *         pais: "España"
 *         ingresos: 1500
 *         visitas: 300
 * 
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /api/v1/datasets:
 *   post:
 *     summary: Create a new dataset by uploading two files
 *     tags:
 *       - Datasets
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fileA
 *               - fileB
 *             properties:
 *               fileA:
 *                 type: string
 *                 format: binary
 *                 description: First CSV/Excel file (Group A)
 *               fileB:
 *                 type: string
 *                 format: binary
 *                 description: Second CSV/Excel file (Group B)
 *               groupALabel:
 *                 type: string
 *                 default: "Grupo A"
 *               groupBLabel:
 *                 type: string
 *                 default: "Grupo B"
 *     responses:
 *       201:
 *         description: Dataset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     datasetId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "processing"
 *                     rowCount:
 *                       type: integer
 *                     groupA:
 *                       type: object
 *                     groupB:
 *                       type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @openapi
 * /api/v1/datasets:
 *   get:
 *     summary: List all datasets for the authenticated user
 *     tags:
 *       - Datasets
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of datasets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dataset'
 *                 total:
 *                   type: integer
 */

/**
 * @openapi
 * /api/v1/datasets/{id}:
 *   get:
 *     summary: Get a specific dataset by ID
 *     tags:
 *       - Datasets
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset retrieved successfully
 *       404:
 *         description: Dataset not found
 *       403:
 *         description: Access denied (not owner)
 */

/**
 * @openapi
 * /api/v1/datasets/{id}:
 *   patch:
 *     summary: Update dataset mapping configuration
 *     tags:
 *       - Datasets
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - meta
 *               - schemaMapping
 *               - dashboardLayout
 *             properties:
 *               meta:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     maxLength: 100
 *                   description:
 *                     type: string
 *                     maxLength: 500
 *               schemaMapping:
 *                 type: object
 *               dashboardLayout:
 *                 type: object
 *               aiConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Mapping updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Dataset not found
 */

/**
 * @openapi
 * /api/v1/datasets/{id}:
 *   delete:
 *     summary: Delete a dataset
 *     tags:
 *       - Datasets
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset deleted successfully
 *       404:
 *         description: Dataset not found
 *       403:
 *         description: Access denied (not owner)
 */
```

---

## 🧪 INTEGRATION TESTS

**File:** `modules/datasets/__tests__/integration/datasets.api.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js'; // Your Express app
import { connectDatabase, closeDatabase } from '@/config/database.js';
import fs from 'fs';
import path from 'path';

describe('Datasets API Integration', () => {
  let authToken: string;
  let datasetId: string;

  beforeAll(async () => {
    await connectDatabase();
    // TODO: Get real auth token from login endpoint
    authToken = 'Bearer test-jwt-token';
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/v1/datasets', () => {
    it('should create dataset with valid CSV files', async () => {
      const fileAPath = path.join(__dirname, '../fixtures/sales_2024.csv');
      const fileBPath = path.join(__dirname, '../fixtures/sales_2023.csv');

      const response = await request(app)
        .post('/api/v1/datasets')
        .set('Authorization', authToken)
        .attach('fileA', fileAPath)
        .attach('fileB', fileBPath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.datasetId).toBeDefined();
      expect(response.body.data.status).toBe('processing');

      datasetId = response.body.data.datasetId;
    });

    it('should reject files with mismatched headers', async () => {
      // TODO: Create fixture files with different headers
      const response = await request(app)
        .post('/api/v1/datasets')
        .set('Authorization', authToken)
        .attach('fileA', 'different_headers_A.csv')
        .attach('fileB', 'different_headers_B.csv');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('headers');
    });

    it('should reject files exceeding size limit', async () => {
      // TODO: Test with 11MB file
    });
  });

  describe('GET /api/v1/datasets/:id', () => {
    it('should retrieve dataset by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/datasets/${datasetId}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(datasetId);
      expect(response.body.data.data).toBeDefined(); // data rows included
    });

    it('should reject access to other user\'s dataset', async () => {
      const otherUserToken = 'Bearer other-user-token';
      
      const response = await request(app)
        .get(`/api/v1/datasets/${datasetId}`)
        .set('Authorization', otherUserToken);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/datasets/:id', () => {
    it('should update mapping configuration', async () => {
      const payload = {
        meta: {
          name: 'Test Dataset',
          description: 'Integration test'
        },
        schemaMapping: {
          dimensionField: 'fecha',
          kpiFields: [
            {
              id: 'kpi_1',
              columnName: 'ventas',
              label: 'Ventas',
              format: 'currency'
            }
          ]
        },
        dashboardLayout: {
          templateId: 'sideby_executive',
          highlightedKpis: ['kpi_1']
        }
      };

      const response = await request(app)
        .patch(`/api/v1/datasets/${datasetId}`)
        .set('Authorization', authToken)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('ready');
    });
  });

  describe('DELETE /api/v1/datasets/:id', () => {
    it('should delete dataset', async () => {
      const response = await request(app)
        .delete(`/api/v1/datasets/${datasetId}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/v1/datasets/${datasetId}`)
        .set('Authorization', authToken);

      expect(getResponse.status).toBe(404);
    });
  });
});
```

---

## 🧹 CLEANUP JOB (Bonus)

**File:** `modules/datasets/jobs/cleanup-abandoned.job.ts`

```typescript
import { MongoDatasetRepository } from '../infrastructure/mongoose/MongoDatasetRepository.js';
import logger from '@/utils/logger.js';

const ABANDONED_AFTER_HOURS = 24;

export async function cleanupAbandonedDatasets(): Promise<void> {
  try {
    const repository = new MongoDatasetRepository();
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - ABANDONED_AFTER_HOURS);

    const abandoned = await repository.findAbandoned(cutoffDate);

    logger.info(`Found ${abandoned.length} abandoned datasets`);

    for (const dataset of abandoned) {
      await repository.delete(dataset.id);
      logger.info(`Deleted abandoned dataset: ${dataset.id}`);
    }

    logger.info('Cleanup job completed');
  } catch (error) {
    logger.error({ err: error }, 'Cleanup job failed');
  }
}

// Schedule with cron (in main app.ts or separate scheduler)
// import cron from 'node-cron';
// cron.schedule('0 2 * * *', cleanupAbandonedDatasets); // Every day at 2am
```

---

## ✅ DEFINITION OF DONE

Before marking this task complete, ensure:

### TDD Compliance
- [ ] All unit tests written BEFORE implementation (Red phase)
- [ ] All tests passing (Green phase)
- [ ] Code refactored following SOLID principles (Refactor phase)
- [ ] Test coverage > 80% for use cases

### Architecture Validation
- [ ] Clean Architecture layers respected (Domain → Application → Infrastructure → Presentation)
- [ ] No dependencies pointing inward violated
- [ ] All imports use `.js` extension (ESM compliance)
- [ ] Pino logger used (no `console.log`)

### Security Checklist
- [ ] JWT middleware validates token expiration
- [ ] Ownership validation in all endpoints
- [ ] Rate limiting configured
- [ ] File size validation enforced
- [ ] Row count limits enforced
- [ ] No sensitive data logged

### Documentation
- [ ] OpenAPI specs complete and accurate
- [ ] All DTOs documented
- [ ] Error codes documented
- [ ] JSDoc comments in Spanish

### Integration
- [ ] Routes registered in main `app.ts`
- [ ] Mongoose model registered
- [ ] Error handler catches custom errors
- [ ] Manual testing with Postman/Thunder Client successful

---

## 📦 DEPENDENCIES TO INSTALL

```bash
cd solution-sideby/apps/api

npm install --save \
  multer \
  @types/multer \
  express-rate-limit \
  papaparse \
  @types/papaparse \
  zod
```

---

## 🎯 EXECUTION ORDER

1. **Phase 0: Setup**
   - Install dependencies
   - Create middleware files (auth, rate-limit)

2. **Phase 1: Domain Layer (TDD)**
   - Write validation.rules.ts
   - Write Dataset.entity.ts
   - Write error classes
   - Write DatasetRepository interface

3. **Phase 2: Application Layer (TDD)**
   - Write test specs for CreateDatasetUseCase
   - Implement CreateDatasetUseCase
   - Repeat for other use cases

4. **Phase 3: Infrastructure Layer**
   - Implement DatasetSchema (Mongoose)
   - Implement MongoDatasetRepository
   - Implement CSV parser utilities

5. **Phase 4: Presentation Layer**
   - Implement controller methods
   - Implement routes
   - Implement Zod schemas
   - Write OpenAPI specs

6. **Phase 5: Integration Tests**
   - Write API integration tests
   - Create test fixtures (CSV files)
   - Verify all endpoints

7. **Phase 6: Cleanup & Documentation**
   - Implement cleanup job
   - Update main app.ts
   - Final review

---

## 🚨 CRITICAL REMINDERS

1. **NEVER use `console.log`** → Use Pino logger
2. **ALWAYS validate ownership** → `dataset.ownerId === req.userId`
3. **ALWAYS use `.js` extension** in imports (ESM)
4. **Comments in SPANISH**, code in **ENGLISH**
5. **TDD is MANDATORY** → Tests first, then implementation
6. **Follow project structure EXACTLY** → No deviations

---

## 📞 QUESTIONS OR BLOCKERS?

If you encounter issues:
1. Check RFC-002 and RFC-003 documentation
2. Review existing auth module structure
3. Ask for clarification before proceeding

---

**Good luck, Backend Agent! Let's build something solid.** 💪

---

**Version:** 1.0  
**Last Updated:** 2026-02-09  
**Estimated Effort:** 8-12 hours
