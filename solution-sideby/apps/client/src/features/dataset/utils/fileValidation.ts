/**
 * File Validation Utilities
 *
 * Validaciones del lado del cliente según RFC-002:
 * - Tamaño máximo: 2MB
 * - Formatos: .csv, .xlsx, .xls
 * - Estructura mínima: 2 columnas, 1 fila de datos
 * - Headers deb coincidir entre archivos A y B
 */

import type { FileValidationError } from "../types/wizard.types.js";

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALIDATION_RULES = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_EXTENSIONS: [".csv", ".xlsx", ".xls"],
  ALLOWED_MIME_TYPES: [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  MIN_COLUMNS: 2,
  MIN_ROWS: 1,
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida el tamaño del archivo
 */
export function validateFileSize(file: File): FileValidationError | null {
  if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
    return {
      code: "SIZE_EXCEEDED",
      message: `El archivo "${file.name}" excede el tamaño máximo de 2MB (${formatFileSize(file.size)})`,
      file: file.name,
    };
  }
  return null;
}

/**
 * Valida el formato del archivo (extensión y MIME type)
 */
export function validateFileFormat(file: File): FileValidationError | null {
  const extension = getFileExtension(file.name);

  if (
    !VALIDATION_RULES.ALLOWED_EXTENSIONS.includes(
      extension as ".csv" | ".xlsx" | ".xls",
    )
  ) {
    return {
      code: "INVALID_FORMAT",
      message: `Formato no soportado: ${extension}. Solo se permiten archivos CSV y Excel (.csv, .xlsx, .xls)`,
      file: file.name,
    };
  }

  // Validar MIME type (más seguro que solo extensión)
  if (
    !VALIDATION_RULES.ALLOWED_MIME_TYPES.includes(
      file.type as (typeof VALIDATION_RULES.ALLOWED_MIME_TYPES)[number],
    )
  ) {
    console.warn(`MIME type no reconocido: ${file.type} para ${file.name}`);
    // No bloqueamos por MIME type porque algunos navegadores no lo detectan bien
  }

  return null;
}

/**
 * Valida la estructura del archivo parseado
 */
export function validateFileStructure(
  headers: string[],
  rows: Record<string, unknown>[],
  fileName: string,
): FileValidationError | null {
  // Validar mínimo de columnas
  if (headers.length < VALIDATION_RULES.MIN_COLUMNS) {
    return {
      code: "STRUCTURE_INVALID",
      message: `El archivo "${fileName}" debe tener al menos ${VALIDATION_RULES.MIN_COLUMNS} columnas (encontradas: ${headers.length})`,
      file: fileName,
    };
  }

  // Validar mínimo de filas
  if (rows.length < VALIDATION_RULES.MIN_ROWS) {
    return {
      code: "STRUCTURE_INVALID",
      message: `El archivo "${fileName}" debe tener al menos ${VALIDATION_RULES.MIN_ROWS} fila de datos`,
      file: fileName,
    };
  }

  // Validar que los headers no estén vacíos
  const emptyHeaders = headers.filter((h) => !h || h.trim() === "");
  if (emptyHeaders.length > 0) {
    return {
      code: "STRUCTURE_INVALID",
      message: `El archivo "${fileName}" contiene columnas sin nombre. Asegúrate de que todas las columnas tengan encabezados`,
      file: fileName,
    };
  }

  return null;
}

/**
 * Valida que los headers de ambos archivos coincidan
 */
export function validateHeadersMatch(
  headersA: string[],
  headersB: string[],
  fileNameA: string,
  fileNameB: string,
): FileValidationError | null {
  if (headersA.length !== headersB.length) {
    return {
      code: "HEADERS_MISMATCH",
      message: `Los archivos deben tener el mismo número de columnas. "${fileNameA}" tiene ${headersA.length} columnas y "${fileNameB}" tiene ${headersB.length}`,
    };
  }

  // Comparar headers (case-insensitive y sin espacios)
  for (let i = 0; i < headersA.length; i++) {
    const headerA = headersA[i].trim().toLowerCase();
    const headerB = headersB[i].trim().toLowerCase();

    if (headerA !== headerB) {
      return {
        code: "HEADERS_MISMATCH",
        message: `Las columnas deben coincidir en orden y nombre. Diferencia en posición ${i + 1}: "${headersA[i]}" vs "${headersB[i]}"`,
      };
    }
  }

  return null;
}

/**
 * Valida completamente un archivo (tamaño + formato + estructura)
 */
export function validateFile(
  file: File,
  parsedData?: { headers: string[]; rows: Record<string, unknown>[] },
): FileValidationError | null {
  // Validar tamaño
  const sizeError = validateFileSize(file);
  if (sizeError) return sizeError;

  // Validar formato
  const formatError = validateFileFormat(file);
  if (formatError) return formatError;

  // Si hay datos parseados, validar estructura
  if (parsedData) {
    const structureError = validateFileStructure(
      parsedData.headers,
      parsedData.rows,
      file.name,
    );
    if (structureError) return structureError;
  }

  return null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene la extensión del archivo
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
}

/**
 * Formatea el tamaño del archivo para mostrar
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Verifica si un archivo es CSV
 */
export function isCSV(file: File): boolean {
  return getFileExtension(file.name) === ".csv";
}

/**
 * Verifica si un archivo es Excel
 */
export function isExcel(file: File): boolean {
  const ext = getFileExtension(file.name);
  return ext === ".xlsx" || ext === ".xls";
}
