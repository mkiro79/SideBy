/**
 * API Types - Contracts de comunicación con el Backend
 *
 * Define las interfaces de Request/Response para el módulo de Datasets.
 * Estos tipos DEBEN coincidir exactamente con los DTOs del backend.
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Request para POST /api/v1/datasets - Upload de archivos
 * Nota: Se envía como multipart/form-data, no JSON
 */
export interface UploadFilesRequest {
  fileA: File;
  fileB: File;
}

/**
 * Request para PATCH /api/v1/datasets/:id - Configuración de mapping
 */
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
      format: "number" | "currency" | "percentage";
      highlighted?: boolean; // ✅ Campo para marcar KPIs destacados
    }>;
    categoricalFields?: string[];
  };
  dashboardLayout: {
    templateId: "sideby_executive";
    highlightedKpis: string[];
  };
  aiConfig?: {
    enabled: boolean;
    userContext?: string;
  };
  sourceConfig?: {
    groupA?: {
      label?: string;
      color?: string;
    };
    groupB?: {
      label?: string;
      color?: string;
    };
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Response de POST /api/v1/datasets
 */
export interface UploadFilesResponse {
  success: boolean;
  data: {
    datasetId: string;
    status: "processing";
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

/**
 * Response de PATCH /api/v1/datasets/:id
 */
export interface UpdateMappingResponse {
  success: boolean;
  data: {
    datasetId: string;
    status: "ready";
  };
}

/**
 * Estructura de una fila de datos
 */
export interface DataRow {
  _source_group: "groupA" | "groupB";
  [key: string]: string | number | boolean;
}

/**
 * Dataset completo (Response de GET /api/v1/datasets/:id)
 */
export interface Dataset {
  id: string;
  ownerId: string;
  status: "processing" | "ready" | "error";
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
      format: "number" | "currency" | "percentage";
      highlighted?: boolean; // ✅ Campo para marcar KPIs destacados
    }>;
    categoricalFields?: string[];
  };
  dashboardLayout?: {
    templateId: string;
    highlightedKpis: string[];
  };
  aiConfig?: {
    enabled: boolean;
    Enabled?: boolean;
    userContext?: string;
    lastAnalysis?: string;
  };
  data: DataRow[];
}

/**
 * Dataset resumido (Response de GET /api/v1/datasets - List)
 * Nota: No incluye el campo 'data' para optimizar transferencia
 */
export interface DatasetSummary {
  id: string;
  status: "processing" | "ready" | "error";
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
  kpis?: string[];
  aiConfig?: {
    enabled: boolean;
    userContext?: string;
    lastAnalysis?: string;
  };
  totalRows: number;
}

/**
 * Response de GET /api/v1/datasets (List)
 */
export interface ListDatasetsResponse {
  success: boolean;
  data: DatasetSummary[];
  total: number;
}

/**
 * Response de DELETE /api/v1/datasets/:id
 */
export interface DeleteDatasetResponse {
  success: boolean;
  message: string;
}

/**
 * Error genérico de API
 */
export interface ApiError {
  success: false;
  error: string;
}

export interface DatasetInsight {
  id: string;
  datasetId: string;
  type: "summary" | "warning" | "suggestion" | "trend" | "anomaly";
  severity: 1 | 2 | 3 | 4 | 5;
  icon: "💡" | "⚠️" | "✨" | "📈" | "📉" | "🚨" | "✅";
  title: string;
  message: string;
  metadata: {
    kpi?: string;
    dimension?: string;
    value?: number;
    change?: number;
    period?: string;
  };
  generatedBy: "rule-engine" | "ai-model";
  confidence: number;
  generatedAt: string;
}

export interface BusinessNarrative {
  summary: string;
  recommendedActions: string[];
  language: "es" | "en";
  generatedBy: "ai-model";
  confidence: number;
  generatedAt: string;
}

export interface DatasetInsightsResponse {
  insights: DatasetInsight[];
  businessNarrative?: BusinessNarrative;
  meta: {
    total: number;
    generatedAt: string;
    cacheStatus: "hit" | "miss" | "stale";
    generationSource: "rule-engine" | "ai-model" | "mixed" | "unknown";
    narrativeStatus?: "not-requested" | "generated" | "fallback";
    generationTimeMs: number;
  };
}
