/**
 * Auto-Classification Utility
 *
 * Clasifica automáticamente columnas de CSV basándose en los primeros 50 registros:
 * - Date: Coincide con formatos comunes (YYYY-MM-DD, DD/MM/YYYY, ISO8601)
 * - Numeric: Todos los valores son números o vacíos
 * - String: Columnas de texto (fallback por defecto)
 *
 * @module autoClassify
 */

/**
 * Resultado de la clasificación automática de columnas
 */
export interface ColumnClassification {
  dateColumns: string[];
  numericColumns: string[];
  stringColumns: string[];
}

/**
 * Clasifica automáticamente las columnas de un CSV
 *
 * @param headers - Array de nombres de columnas
 * @param rows - Array de filas (objetos con key-value)
 * @returns Objeto con columnas clasificadas por tipo
 *
 * @example
 * ```typescript
 * const headers = ['fecha', 'ventas', 'region'];
 * const rows = [
 *   { fecha: '2024-01-15', ventas: 1000, region: 'Norte' },
 *   { fecha: '2024-02-20', ventas: 1500, region: 'Sur' },
 * ];
 *
 * const result = autoClassifyColumns(headers, rows);
 * // {
 * //   dateColumns: ['fecha'],
 * //   numericColumns: ['ventas'],
 * //   stringColumns: ['region']
 * // }
 * ```
 */
export function autoClassifyColumns(
  headers: string[],
  rows: Record<string, unknown>[],
): ColumnClassification {
  // Tomar solo los primeros 50 registros para mejorar performance
  const sample = rows.slice(0, 50);

  const dateColumns: string[] = [];
  const numericColumns: string[] = [];
  const stringColumns: string[] = [];

  headers.forEach((header) => {
    const values = sample.map((row) => row[header]);

    // Prioridad 1: Detectar fechas
    if (isDateColumn(values)) {
      dateColumns.push(header);
      return;
    }

    // Prioridad 2: Detectar numéricos
    if (isNumericColumn(values)) {
      numericColumns.push(header);
      return;
    }

    // Fallback: Clasificar como string
    stringColumns.push(header);
  });

  return { dateColumns, numericColumns, stringColumns };
}

/**
 * Detecta si una columna contiene fechas
 *
 * Criterio: Al menos 80% de los valores no vacíos coinciden con patrones de fecha
 *
 * @param values - Array de valores de la columna
 * @returns true si es una columna de fecha
 */
function isDateColumn(values: unknown[]): boolean {
  if (values.length === 0) return false;

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{4}-\d{2}-\d{2}T/, // ISO8601 (starts with)
  ];

  const matches = values.filter((v) => {
    if (typeof v !== "string") return false;
    return datePatterns.some((pattern) => pattern.test(v));
  });

  // Threshold: 80% de coincidencia
  return matches.length / values.length > 0.8;
}

/**
 * Detecta si una columna contiene valores numéricos
 *
 * Criterio: Al menos 90% de los valores son números o vacíos
 *
 * @param values - Array de valores de la columna
 * @returns true si es una columna numérica
 */
function isNumericColumn(values: unknown[]): boolean {
  if (values.length === 0) return false;

  const numericValues = values.filter((v) => {
    // Permitir valores vacíos/null
    if (v === null || v === undefined || v === "") return true;

    // Verificar si es número directo
    if (typeof v === "number") return true;

    // Verificar si es string que se puede convertir a número
    if (typeof v === "string") {
      const num = Number(v);
      return !Number.isNaN(num);
    }

    return false;
  });

  // Threshold: 90% de valores numéricos o vacíos
  return numericValues.length / values.length > 0.9;
}
