import type {
  Dataset,
  DatasetStatus,
  SchemaMapping,
  DashboardLayout,
  AIConfig,
  GroupConfig,
} from "@/modules/datasets/domain/Dataset.entity.js";

// ========================================
// CREATE DATASET
// ========================================

/**
 * Input para crear un nuevo dataset.
 * Recibe los dos archivos subidos y metadata opcional.
 */
export interface CreateDatasetInput {
  /** ID del usuario propietario (extraído del JWT) */
  ownerId: string;

  /** Primer archivo (Grupo A) */
  fileA: {
    buffer: Buffer;
    originalName: string;
    mimetype: string;
    size: number;
  };

  /** Segundo archivo (Grupo B) */
  fileB: {
    buffer: Buffer;
    originalName: string;
    mimetype: string;
    size: number;
  };

  /** Etiqueta personalizada para el Grupo A (opcional, default: "Grupo A") */
  groupALabel?: string;

  /** Color para el Grupo A (opcional, default: #3b82f6) */
  groupAColor?: string;

  /** Etiqueta personalizada para el Grupo B (opcional, default: "Grupo B") */
  groupBLabel?: string;

  /** Color para el Grupo B (opcional, default: #6366f1) */
  groupBColor?: string;
}

/**
 * Output de la creación del dataset.
 * Confirma que los archivos fueron procesados correctamente.
 */
export interface CreateDatasetOutput {
  /** ID del dataset creado */
  datasetId: string;

  /** Estado inicial (siempre "processing") */
  status: DatasetStatus;

  /** Número total de filas unificadas */
  rowCount: number;

  /** Información del Grupo A */
  groupA: {
    fileName: string;
    rowCount: number;
  };

  /** Información del Grupo B */
  groupB: {
    fileName: string;
    rowCount: number;
  };
}

// ========================================
// UPDATE MAPPING
// ========================================

/**
 * Input para actualizar la configuración de mapping de un dataset.
 * Este paso completa la configuración y cambia el status a "ready".
 */
export interface UpdateMappingInput {
  /** ID del dataset a actualizar */
  datasetId: string;

  /** ID del usuario propietario (para validación de ownership) */
  ownerId: string;

  /** Metadata descriptiva del dataset */
  meta: {
    name: string;
    description?: string;
  };

  /** Configuración del mapping de campos */
  schemaMapping: SchemaMapping;

  /** Configuración del layout del dashboard */
  dashboardLayout: DashboardLayout;

  /** Configuración de IA (opcional) */
  aiConfig?: AIConfig;

  /** Configuración de grupos (opcional) */
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

/**
 * Output de la actualización del mapping.
 * Confirma que el dataset está listo para usar.
 */
export interface UpdateMappingOutput {
  /** ID del dataset actualizado */
  datasetId: string;

  /** Nuevo estado (siempre "ready") */
  status: "ready";

  /** Fecha de actualización */
  updatedAt: Date;
}

// ========================================
// GET DATASET BY ID
// ========================================

/**
 * Input para obtener un dataset específico.
 */
export interface GetDatasetByIdInput {
  /** ID del dataset a recuperar */
  datasetId: string;

  /** ID del usuario solicitante (para validación de ownership) */
  ownerId: string;
}

/**
 * Output que devuelve el dataset completo.
 * Incluye todos los datos para visualización.
 */
export type GetDatasetByIdOutput = Dataset;

// ========================================
// LIST DATASETS
// ========================================

/**
 * Input para listar datasets de un usuario.
 */
export interface ListDatasetsInput {
  /** ID del usuario propietario */
  ownerId: string;
}

/**
 * Dataset simplificado para vista de lista.
 * Excluye el array de datos para evitar respuestas pesadas.
 */
export interface DatasetListItem {
  id: string;
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
  /** Etiquetas de KPIs configurados en el dataset */
  kpis: string[];
  /** Número total de filas (para mostrar en lista) */
  totalRows: number;
}

/**
 * Output de la lista de datasets.
 */
export interface ListDatasetsOutput {
  /** Array de datasets (vacío si no hay resultados) */
  datasets: DatasetListItem[];

  /** Número total de datasets */
  total: number;
}

// ========================================
// DELETE DATASET
// ========================================

/**
 * Input para eliminar un dataset.
 */
export interface DeleteDatasetInput {
  /** ID del dataset a eliminar */
  datasetId: string;

  /** ID del usuario solicitante (para validación de ownership) */
  ownerId: string;
}

/**
 * Output de la eliminación.
 * Confirma que el dataset fue borrado.
 */
export interface DeleteDatasetOutput {
  /** ID del dataset eliminado */
  datasetId: string;

  /** Mensaje de confirmación */
  message: string;
}
