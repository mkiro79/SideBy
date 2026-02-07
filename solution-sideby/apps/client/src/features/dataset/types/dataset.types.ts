/**
 * Dataset Types - Interfaces TypeScript para el módulo de datasets
 *
 * Define la estructura de datos para datasets comparativos
 */

// ============================================================================
// DATASET INTERFACE
// ============================================================================

export interface Dataset {
  id: string;
  name: string;
  description: string;
  fileA: string;
  fileB: string;
  createdAt: string;
  kpis: string[];
  rowCount: number;
}

// ============================================================================
// DATASET DTO (Data Transfer Object)
// ============================================================================

export interface CreateDatasetDto {
  name: string;
  description: string;
  fileA: File;
  fileB: File;
}

export interface UpdateDatasetDto {
  id: string;
  name?: string;
  description?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface DatasetResponse {
  success: boolean;
  data: Dataset;
  message?: string;
}

export interface DatasetsListResponse {
  success: boolean;
  data: Dataset[];
  total: number;
  message?: string;
}
