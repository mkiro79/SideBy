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
 * Unifica los datos de ambos archivos en el formato DataRow
 * Realiza un join basado en el campo de dimensión para manejar
 * correctamente filas desordenadas o faltantes entre datasets
 */
export function unifyDatasets(
  dataA: ParsedFileData,
  dataB: ParsedFileData,
  dimensionField: string,
): Record<string, unknown>[] {
  const unifiedData: Record<string, unknown>[] = [];

  // Crear un mapa del dataset B usando dimensionField como clave
  // para búsqueda O(1) en lugar de asumir alineación por índice
  const dataBMap = new Map<unknown, Record<string, unknown>>();
  dataB.rows.forEach((row) => {
    const dimensionValue = row[dimensionField];
    if (dimensionValue !== null && dimensionValue !== undefined) {
      dataBMap.set(dimensionValue, row);
    }
  });

  // Iterar sobre las filas del archivo A y hacer join por dimensionField
  dataA.rows.forEach((rowA) => {
    const dimensionValue = rowA[dimensionField];

    // Buscar la fila correspondiente en B por el valor de dimensión
    const rowB = dataBMap.get(dimensionValue);

    // Crear fila unificada con estructura: { [dimension]: value, ...kpisA, ...kpisB }
    const unifiedRow: Record<string, unknown> = {
      [dimensionField]: dimensionValue,
    };

    // Copiar todas las columnas de A con sufijo "_current"
    Object.keys(rowA).forEach((key) => {
      if (key !== dimensionField) {
        unifiedRow[`${key}_current`] = rowA[key];
      }
    });

    // Copiar todas las columnas de B con sufijo "_comparative"
    // Solo si existe una fila matching en B
    if (rowB) {
      Object.keys(rowB).forEach((key) => {
        if (key !== dimensionField) {
          unifiedRow[`${key}_comparative`] = rowB[key];
        }
      });
    }

    unifiedData.push(unifiedRow);
  });

  return unifiedData;
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
