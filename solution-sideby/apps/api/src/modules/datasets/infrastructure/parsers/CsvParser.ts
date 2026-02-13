import Papa from "papaparse";
import {
  DatasetValidationError,
  isValidFileExtension,
  isValidFileSize,
  isValidMimeType,
  DatasetRules,
} from "@/modules/datasets/domain/validation.rules.js";
import logger from "@/utils/logger.js";

/**
 * Resultado del parsing de un archivo CSV.
 */
export interface ParsedCSV {
  /** Headers del CSV (nombres de columnas) */
  headers: string[];
  /** Filas de datos parseadas */
  rows: Record<string, string | number>[];
  /** Número total de filas */
  rowCount: number;
}

/**
 * Parser de archivos CSV/Excel.
 *
 * Utiliza Papa Parse para parsear archivos CSV de forma robusta.
 * Valida formato, tamaño y estructura de datos.
 *
 * @example
 * ```typescript
 * const parser = new CsvParser();
 * const result = await parser.parse({
 *   buffer: fileBuffer,
 *   originalName: "sales.csv",
 *   mimetype: "text/csv",
 *   size: 1024000
 * });
 * ```
 */
export class CsvParser {
  /**
   * Parsea un archivo CSV desde un buffer.
   *
   * @param file - Información del archivo a parsear
   * @returns Resultado del parsing con headers y datos
   * @throws DatasetValidationError si el archivo es inválido
   */
  async parse(file: {
    buffer: Buffer;
    originalName: string;
    mimetype: string;
    size: number;
  }): Promise<ParsedCSV> {
    // Validación de formato de archivo
    if (!isValidFileExtension(file.originalName)) {
      throw new DatasetValidationError(
        `Formato de archivo no válido. Solo se aceptan: ${DatasetRules.ALLOWED_EXTENSIONS.join(", ")}`,
        "INVALID_FILE_FORMAT",
      );
    }

    // Validación de tipo MIME
    if (!isValidMimeType(file.mimetype)) {
      throw new DatasetValidationError(
        `Tipo MIME no válido: ${file.mimetype}`,
        "INVALID_FILE_FORMAT",
      );
    }

    // Validación de tamaño
    if (!isValidFileSize(file.size)) {
      throw new DatasetValidationError(
        `Archivo demasiado grande. Máximo: ${DatasetRules.MAX_FILE_SIZE_MB}MB`,
        "FILE_TOO_LARGE",
      );
    }

    try {
      // Convertir buffer a string
      const csvString = file.buffer.toString("utf-8");

      // Parsear con Papa Parse
      const parseResult = Papa.parse<Record<string, string>>(csvString, {
        header: true, // Primera fila como headers
        skipEmptyLines: true,
        dynamicTyping: true, // Convertir números automáticamente
        transformHeader: (header: string) => header.trim(), // Limpiar espacios
      });

      if (parseResult.errors.length > 0) {
        logger.error(
          { errors: parseResult.errors, filename: file.originalName },
          "CSV parsing errors",
        );
        throw new DatasetValidationError(
          `Error al parsear CSV: ${parseResult.errors[0]?.message || "Formato inválido"}`,
          "INVALID_FILE_FORMAT",
        );
      }

      const rows = parseResult.data;
      const headers = parseResult.meta.fields || [];

      // Validación: debe haber al menos una fila de datos
      if (rows.length < DatasetRules.MIN_ROWS) {
        throw new DatasetValidationError(
          `El archivo debe contener al menos ${DatasetRules.MIN_ROWS} fila de datos`,
          "TOO_FEW_ROWS",
        );
      }

      // Validación: no debe exceder el límite de columnas
      if (headers.length > DatasetRules.MAX_COLUMNS) {
        throw new DatasetValidationError(
          `Máximo ${DatasetRules.MAX_COLUMNS} columnas permitidas`,
          "TOO_MANY_COLUMNS",
        );
      }

      // Validación: headers no deben estar vacíos
      const emptyHeaders = headers.filter((h) => !h || h.trim() === "");
      if (emptyHeaders.length > 0) {
        throw new DatasetValidationError(
          "El archivo contiene columnas sin nombre (headers vacíos)",
          "INVALID_FILE_FORMAT",
        );
      }

      logger.info(
        {
          filename: file.originalName,
          rowCount: rows.length,
          columnCount: headers.length,
        },
        "CSV parsed successfully",
      );

      return {
        headers,
        rows: rows as Record<string, string | number>[],
        rowCount: rows.length,
      };
    } catch (error) {
      if (error instanceof DatasetValidationError) {
        throw error;
      }

      logger.error(
        { err: error, filename: file.originalName },
        "Unexpected error parsing CSV",
      );

      throw new DatasetValidationError(
        "Error inesperado al procesar el archivo CSV",
        "INVALID_FILE_FORMAT",
      );
    }
  }

  /**
   * Valida que dos conjuntos de headers coincidan exactamente.
   *
   * Los archivos deben tener las mismas columnas en el mismo orden
   * para poder unificarlos correctamente.
   *
   * @param headersA - Headers del primer archivo
   * @param headersB - Headers del segundo archivo
   * @throws DatasetValidationError si los headers no coinciden
   */
  validateHeadersMatch(headersA: string[], headersB: string[]): void {
    if (headersA.length !== headersB.length) {
      throw new DatasetValidationError(
        `Los archivos tienen diferente número de columnas (${headersA.length} vs ${headersB.length})`,
        "HEADERS_MISMATCH",
      );
    }

    const mismatchedHeaders: string[] = [];

    for (let i = 0; i < headersA.length; i++) {
      if (headersA[i] !== headersB[i]) {
        mismatchedHeaders.push(
          `Posición ${i + 1}: "${headersA[i]}" != "${headersB[i]}"`,
        );
      }
    }

    if (mismatchedHeaders.length > 0) {
      throw new DatasetValidationError(
        `Los headers de los archivos no coinciden:\n${mismatchedHeaders.join("\n")}`,
        "HEADERS_MISMATCH",
      );
    }
  }
}
