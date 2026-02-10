/**
 * Error lanzado cuando no se encuentra un dataset solicitado.
 *
 * Típicamente ocurre cuando se intenta acceder a un dataset con un ID
 * inexistente o que fue eliminado previamente.
 *
 * Status HTTP sugerido: 404 NOT FOUND
 *
 * @example
 * ```typescript
 * const dataset = await repository.findById(id);
 * if (!dataset) {
 *   throw new DatasetNotFoundError(id);
 * }
 * ```
 */
export class DatasetNotFoundError extends Error {
  /** ID del dataset que no fue encontrado */
  public readonly datasetId: string;

  /** Código de error para identificación en logs y respuestas API */
  public readonly code = "DATASET_NOT_FOUND";

  constructor(datasetId: string) {
    super(`Dataset con ID '${datasetId}' no fue encontrado`);
    this.name = "DatasetNotFoundError";
    this.datasetId = datasetId;

    // Mantiene el stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatasetNotFoundError);
    }
  }
}
