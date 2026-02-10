/**
 * Reglas de validación y límites del dominio Dataset.
 *
 * Estos valores definen las restricciones de negocio para el módulo.
 * Son configurables vía variables de entorno donde aplique.
 */
export const DatasetRules = {
  // ========================================
  // VALIDACIÓN DE ARCHIVOS
  // ========================================

  /** Tamaño máximo de archivo en MB */
  MAX_FILE_SIZE_MB: 10,

  /** Extensiones de archivo permitidas */
  ALLOWED_EXTENSIONS: [".csv", ".xlsx", ".xls"] as const,

  /** Tipos MIME permitidos para archivos */
  ALLOWED_MIME_TYPES: [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ] as const,

  // ========================================
  // LÍMITES DE DATOS
  // ========================================

  /** Número máximo de filas totales (configurable vía env) */
  MAX_ROWS: Number.parseInt(process.env.DATASET_MAX_ROWS || "50000", 10),

  /** Número mínimo de filas por archivo */
  MIN_ROWS: 1,

  /** Número máximo de columnas permitidas */
  MAX_COLUMNS: 100,

  // ========================================
  // VALIDACIÓN DE MAPPING
  // ========================================

  /** Número mínimo de dimensiones requeridas */
  MIN_DIMENSIONS: 1,

  /** Número mínimo de KPIs requeridos */
  MIN_KPIS: 1,

  /** Número máximo de KPIs destacados en dashboard */
  MAX_HIGHLIGHTED_KPIS: 4,

  /** Número máximo de campos categóricos */
  MAX_CATEGORICAL_FIELDS: 10,

  // ========================================
  // VALIDACIÓN DE METADATA
  // ========================================

  /** Longitud máxima del nombre del dataset */
  MAX_NAME_LENGTH: 100,

  /** Longitud mínima del nombre del dataset */
  MIN_NAME_LENGTH: 3,

  /** Longitud máxima de la descripción */
  MAX_DESCRIPTION_LENGTH: 500,

  /** Longitud máxima del label de grupo */
  MAX_GROUP_LABEL_LENGTH: 50,

  // ========================================
  // VALIDACIÓN DE IA
  // ========================================

  /** Longitud máxima del contexto de usuario para IA */
  MAX_AI_CONTEXT_LENGTH: 500,

  /** Longitud máxima del análisis de IA almacenado */
  MAX_AI_ANALYSIS_LENGTH: 5000,

  // ========================================
  // CONFIGURACIÓN DE COLORES POR DEFECTO
  // ========================================

  /** Color por defecto para el Grupo A */
  DEFAULT_COLOR_GROUP_A: "#3b82f6", // Blue

  /** Color por defecto para el Grupo B */
  DEFAULT_COLOR_GROUP_B: "#ef4444", // Red

  // ========================================
  // LÍMITES DE TIEMPO
  // ========================================

  /** Horas después de las cuales un dataset en "processing" se considera abandonado */
  ABANDONED_DATASET_HOURS: 24,
} as const;

/**
 * Códigos de error específicos de validación del dominio Dataset.
 * Usados en DatasetValidationError para categorizar errores.
 */
export type DatasetValidationErrorCode =
  | "INVALID_FILE_FORMAT"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_ROWS"
  | "TOO_FEW_ROWS"
  | "TOO_MANY_COLUMNS"
  | "HEADERS_MISMATCH"
  | "MISSING_DIMENSION"
  | "MISSING_KPI"
  | "TOO_MANY_HIGHLIGHTED"
  | "INVALID_NAME"
  | "INVALID_DESCRIPTION"
  | "INVALID_GROUP_LABEL"
  | "INVALID_AI_CONTEXT"
  | "INVALID_KPI_FORMAT"
  | "INVALID_COLOR";

/**
 * Error de validación de reglas de negocio del dominio Dataset.
 *
 * Se lanza cuando los datos no cumplen con las restricciones definidas
 * en DatasetRules. Incluye un código específico para facilitar el manejo.
 *
 * @example
 * ```typescript
 * if (rows.length > DatasetRules.MAX_ROWS) {
 *   throw new DatasetValidationError(
 *     `Máximo ${DatasetRules.MAX_ROWS} filas permitidas`,
 *     "TOO_MANY_ROWS"
 *   );
 * }
 * ```
 */
export class DatasetValidationError extends Error {
  constructor(
    message: string,
    public code: DatasetValidationErrorCode,
  ) {
    super(message);
    this.name = "DatasetValidationError";

    // Mantiene el stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatasetValidationError);
    }
  }
}

/**
 * Validador de extensiones de archivo.
 *
 * @param filename - Nombre del archivo a validar
 * @returns true si la extensión es válida
 */
export function isValidFileExtension(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return DatasetRules.ALLOWED_EXTENSIONS.includes(
    extension as (typeof DatasetRules.ALLOWED_EXTENSIONS)[number],
  );
}

/**
 * Validador de tamaño de archivo.
 *
 * @param sizeInBytes - Tamaño del archivo en bytes
 * @returns true si el tamaño es válido
 */
export function isValidFileSize(sizeInBytes: number): boolean {
  const maxSizeInBytes = DatasetRules.MAX_FILE_SIZE_MB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
}

/**
 * Validador de tipo MIME de archivo.
 *
 * @param mimeType - Tipo MIME del archivo
 * @returns true si el tipo MIME es válido
 */
export function isValidMimeType(mimeType: string): boolean {
  return DatasetRules.ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof DatasetRules.ALLOWED_MIME_TYPES)[number],
  );
}

/**
 * Validador de formato de color hexadecimal.
 *
 * @param color - Color en formato hexadecimal (#RRGGBB)
 * @returns true si el formato es válido
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
