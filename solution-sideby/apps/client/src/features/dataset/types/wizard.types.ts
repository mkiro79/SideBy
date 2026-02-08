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

// ============================================================================
// COLUMN MAPPING TYPES
// ============================================================================

export interface ColumnMapping {
  dimensionField: string | null;
  dateField?: string | null; // Opcional: columna de fecha para análisis temporal
  kpiFields: KPIMappingField[];
}

export interface KPIMappingField {
  id: string;
  columnName: string;
  label: string;
  format: "number" | "currency" | "percentage";
  highlighted?: boolean; // Opcional: indica si el KPI se destaca en el dashboard (max 4)
}

// ============================================================================
// WIZARD STATE
// ============================================================================

export interface WizardState {
  currentStep: WizardStep;

  // Step 1: File Upload
  fileA: FileGroup;
  fileB: FileGroup;

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
  type: "number" | "currency" | "percentage";
  aggregation: "sum" | "avg" | "count";
  format: "number" | "currency" | "percentage";
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
