import type {
  DataRow,
  SourceGroup,
} from "@/modules/datasets/domain/Dataset.entity.js";
import {
  DatasetValidationError,
  DatasetRules,
} from "@/modules/datasets/domain/validation.rules.js";
import logger from "@/utils/logger.js";

/**
 * Unificador de datos de múltiples fuentes.
 *
 * Combina datos de dos archivos CSV añadiendo el campo especial
 * `_source_group` que identifica de qué archivo proviene cada fila.
 *
 * Esto permite hacer comparaciones side-by-side en el frontend.
 *
 * @example
 * ```typescript
 * const unifier = new DataUnifier();
 * const unified = unifier.unify(
 *   dataA,  // [{fecha: "2024-01", ventas: 1000}]
 *   dataB   // [{fecha: "2023-01", ventas: 900}]
 * );
 * // Resultado:
 * // [
 * //   {_source_group: "groupA", fecha: "2024-01", ventas: 1000},
 * //   {_source_group: "groupB", fecha: "2023-01", ventas: 900}
 * // ]
 * ```
 */
export class DataUnifier {
  /**
   * Unifica datos de dos fuentes añadiendo el tag `_source_group`.
   *
   * @param dataA - Filas del primer archivo (Grupo A)
   * @param dataB - Filas del segundo archivo (Grupo B)
   * @returns Array unificado con campo `_source_group`
   * @throws DatasetValidationError si el total de filas excede el límite
   */
  unify(
    dataA: Record<string, string | number>[],
    dataB: Record<string, string | number>[],
  ): DataRow[] {
    const totalRows = dataA.length + dataB.length;

    // Validación: total de filas no debe exceder el máximo permitido
    if (totalRows > DatasetRules.MAX_ROWS) {
      throw new DatasetValidationError(
        `Total de filas (${totalRows}) excede el máximo permitido (${DatasetRules.MAX_ROWS})`,
        "TOO_MANY_ROWS",
      );
    }

    logger.info(
      {
        groupARows: dataA.length,
        groupBRows: dataB.length,
        totalRows,
      },
      "Unifying data from two sources",
    );

    // Añadir tag de grupo a cada fila
    const taggedA = this.tagRows(dataA, "groupA");
    const taggedB = this.tagRows(dataB, "groupB");

    // Combinar ambos arrays
    const unifiedData = [...taggedA, ...taggedB];

    logger.info(
      { unifiedRows: unifiedData.length },
      "Data unification completed",
    );

    return unifiedData;
  }

  /**
   * Añade el campo `_source_group` a cada fila.
   *
   * @param rows - Filas originales
   * @param group - Identificador de grupo (groupA o groupB)
   * @returns Filas con campo `_source_group` añadido
   */
  private tagRows(
    rows: Record<string, string | number>[],
    group: SourceGroup,
  ): DataRow[] {
    return rows.map((row) => ({
      _source_group: group,
      ...row,
    }));
  }

  /**
   * Valida que los datos unificados no contengan filas vacías o inválidas.
   *
   * @param data - Datos unificados a validar
   * @throws DatasetValidationError si hay datos inválidos
   */
  validateUnifiedData(data: DataRow[]): void {
    // Validar que todas las filas tengan el campo _source_group
    const missingSourceGroup = data.filter((row) => !row._source_group);
    if (missingSourceGroup.length > 0) {
      throw new DatasetValidationError(
        `Hay ${missingSourceGroup.length} filas sin campo _source_group`,
        "INVALID_FILE_FORMAT",
      );
    }

    // Validar que _source_group tenga valores válidos
    const invalidSourceGroup = data.filter(
      (row) => row._source_group !== "groupA" && row._source_group !== "groupB",
    );
    if (invalidSourceGroup.length > 0) {
      throw new DatasetValidationError(
        `Hay ${invalidSourceGroup.length} filas con _source_group inválido`,
        "INVALID_FILE_FORMAT",
      );
    }

    // Validar que cada fila tenga al menos un campo además de _source_group
    const emptyRows = data.filter((row) => Object.keys(row).length <= 1);
    if (emptyRows.length > 0) {
      throw new DatasetValidationError(
        `Hay ${emptyRows.length} filas vacías (solo contienen _source_group)`,
        "INVALID_FILE_FORMAT",
      );
    }

    logger.info({ totalRows: data.length }, "Unified data validation passed");
  }
}
