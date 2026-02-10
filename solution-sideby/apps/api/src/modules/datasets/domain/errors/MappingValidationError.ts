/**
 * Error lanzado cuando la configuración de mapping es inválida.
 *
 * Ocurre cuando los datos de configuración (schemaMapping, dashboardLayout)
 * no cumplen con las reglas del dominio.
 *
 * Status HTTP sugerido: 400 BAD REQUEST
 *
 * @example
 * ```typescript
 * if (kpiFields.length < DatasetRules.MIN_KPIS) {
 *   throw new MappingValidationError(
 *     "MISSING_KPI",
 *     `Se requiere al menos ${DatasetRules.MIN_KPIS} KPI`
 *   );
 * }
 * ```
 */
export class MappingValidationError extends Error {
  /** Código específico del error de validación */
  public readonly code: string;

  /** Detalles adicionales del error (opcional) */
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MappingValidationError";
    this.code = code;
    this.details = details;

    // Mantiene el stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MappingValidationError);
    }
  }
}
