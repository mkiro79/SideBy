/**
 * Error lanzado cuando un usuario intenta acceder a un dataset
 * que no le pertenece.
 *
 * Ocurre cuando el ownerId del dataset no coincide con el userId
 * del token JWT que realizó la petición.
 *
 * Status HTTP sugerido: 403 FORBIDDEN
 *
 * @example
 * ```typescript
 * if (dataset.ownerId !== userId) {
 *   throw new UnauthorizedAccessError(userId, dataset.id);
 * }
 * ```
 */
export class UnauthorizedAccessError extends Error {
  /** ID del usuario que intentó acceder */
  public readonly userId: string;

  /** ID del dataset al que se intentó acceder */
  public readonly datasetId: string;

  /** Código de error para identificación en logs y respuestas API */
  public readonly code = "UNAUTHORIZED_ACCESS";

  constructor(userId: string, datasetId: string) {
    super(
      `Usuario '${userId}' no tiene permisos para acceder al dataset '${datasetId}'`,
    );
    this.name = "UnauthorizedAccessError";
    this.userId = userId;
    this.datasetId = datasetId;

    // Mantiene el stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnauthorizedAccessError);
    }
  }
}
