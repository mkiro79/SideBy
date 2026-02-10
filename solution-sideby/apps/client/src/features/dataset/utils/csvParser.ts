/**
 * CSV Parser Utility
 *
 * Parsea archivos CSV y Excel usando Papa Parse
 * Retorna headers y rows en formato uniforme
 */

import Papa from "papaparse";
import type {
  ParsedFileData,
  FileValidationError,
} from "../types/wizard.types.js";

// ============================================================================
// PARSE FUNCTIONS
// ============================================================================

/**
 * Parsea un archivo CSV usando Papa Parse
 */
export async function parseCSVFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Convierte números automáticamente
      complete: (results) => {
        if (results.errors.length > 0) {
          const firstError = results.errors[0];
          reject({
            code: "PARSE_ERROR",
            message: `Error parseando CSV: ${firstError.message} (fila ${firstError.row})`,
            file: file.name,
          } as FileValidationError);
          return;
        }

        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, unknown>[];

        resolve({
          headers,
          rows,
          rowCount: rows.length,
        });
      },
      error: (error: Error) => {
        reject({
          code: "PARSE_ERROR",
          message: `Error leyendo archivo: ${error.message}`,
          file: file.name,
        } as FileValidationError);
      },
    });
  });
}

/**
 * Parsea un archivo Excel (XLSX/XLS)
 *
 * NOTA: Papa Parse no soporta Excel directamente.
 * Solución temporal: pedir al usuario que convierta a CSV.
 * EN PRODUCCIÓN: usar librería como 'xlsx' o 'exceljs'
 */
export async function parseExcelFile(file: File): Promise<ParsedFileData> {
  // TODO: Implementar parsing de Excel real
  // Por ahora, retornamos error indicando que use CSV
  const error: FileValidationError = {
    code: "PARSE_ERROR",
    message: `Archivos Excel aún no soportados en esta versión. Por favor, convierte "${file.name}" a formato CSV`,
    file: file.name,
  };

  throw error;
}

/**
 * Detecta el tipo de archivo y parsea según corresponda
 */
export async function parseFile(file: File): Promise<ParsedFileData> {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  switch (extension) {
    case ".csv":
      return parseCSVFile(file);

    case ".xlsx":
    case ".xls":
      return parseExcelFile(file);

    default:
      throw {
        code: "INVALID_FORMAT",
        message: `Formato no soportado: ${extension}`,
        file: file.name,
      } as FileValidationError;
  }
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Unifica los datos de ambos archivos en formato Long (dos filas por registro)
 * Cada fila se etiqueta con _source_group: 'groupA' | 'groupB'
 *
 * Formato de salida:
 * [
 *   { fecha: "2024-01", ventas: 1500, _source_group: "groupA" },
 *   { fecha: "2024-01", ventas: 1200, _source_group: "groupB" }
 * ]
 */
export function unifyDatasets(
  dataA: ParsedFileData,
  dataB: ParsedFileData,
): Record<string, unknown>[] {
  // Añadir tag _source_group a cada fila del dataset A
  const unifiedA = dataA.rows.map((row) => ({
    ...row,
    _source_group: "groupA" as const,
  }));

  // Añadir tag _source_group a cada fila del dataset B
  const unifiedB = dataB.rows.map((row) => ({
    ...row,
    _source_group: "groupB" as const,
  }));

  // Concatenar ambos arrays (Long Format)
  return [...unifiedA, ...unifiedB];
}

/**
 * Extrae una muestra de filas para preview
 */
export function getSampleRows(
  data: ParsedFileData,
  sampleSize: number = 5,
): Record<string, unknown>[] {
  return data.rows.slice(0, sampleSize);
}
