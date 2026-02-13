/**
 * Wizard Types - Tipos para el flujo del wizard de carga de datos
 */

// ============================================================================
// WIZARD STEP TYPES
// ============================================================================

export type WizardStep = 1 | 2 | 3;

export interface StepStatus {
  id: number;
  name: string;
  status: "complete" | "current" | "upcoming";
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface FileValidationError {
  code:
    | "SIZE_EXCEEDED"
    | "INVALID_FORMAT"
    | "STRUCTURE_INVALID"
    | "HEADERS_MISMATCH"
    | "PARSE_ERROR";
  message: string;
  file?: string;
}

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface FileGroup {
  file: File | null;
  parsedData: ParsedFileData | null;
  error: FileValidationError | null;
  isValid: boolean;
}

// Nueva estructura simplificada para RFC-003-A
export interface UploadedFilePreview {
  file: File;
  name: string;
  size: number;
  preview: {
    headers: string[];
    rows: string[][];
  };
}

// ============================================================================
// COLUMN MAPPING TYPES
// ============================================================================

export type KPIFormat =
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "string";

export interface ColumnMapping {
  dimensionField?: string | null;
  dateField?: string | null; // Opcional: columna de fecha para análisis temporal
  kpiFields?: KPIMappingField[];
  [key: string]: unknown; // Permitir propiedades dinámicas para RFC-003-A
}

export interface KPIMappingField {
  id: string;
  columnName: string;
  label: string;
  format: KPIFormat;
  highlighted?: boolean; // Opcional: indica si el KPI se destaca en el dashboard (max 4)
}

// ============================================================================
// WIZARD STATE
// ============================================================================

export interface WizardState {
  currentStep: WizardStep;

  // NEW: Dataset ID from Phase 1 (upload)
  datasetId: string | null;

  // Step 1: File Upload (Legacy structure)
  fileA: FileGroup;
  fileB: FileGroup;

  // Step 1: File Upload (RFC-003-A simplified structure)
  uploadedFiles?: UploadedFilePreview[];

  // Step 2: Column Mapping
  mapping: ColumnMapping;

  // Step 3: Configuration
  metadata: {
    name: string;
    description: string;
  };
  aiConfig: {
    enabled: boolean;
    userContext: string;
  };

  // Global state
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// CREATE DATASET PAYLOAD
// ============================================================================

export interface KPIField {
  id: string;
  sourceColumn: string;
  label: string;
  type: KPIFormat;
  aggregation: "sum" | "avg" | "count";
  format: KPIFormat;
}

export interface CreateDatasetPayload {
  name: string;
  description?: string;
  fileA: File;
  fileB: File;
  mapping: {
    dimensionField: string;
    kpiFields: KPIField[];
  };
  aiConfig?: {
    enabled: boolean;
    userContext?: string;
  };
  unifiedData: Record<string, unknown>[];
}
