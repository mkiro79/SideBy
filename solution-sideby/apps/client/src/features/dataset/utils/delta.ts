/**
 * Utilidades para calcular delta entre valor actual (Grupo A) y referencia (Grupo B).
 */

export type DeltaTrend = "up" | "down" | "neutral";

export interface DeltaResult {
  deltaAbs: number;
  deltaPercent: number;
  trend: DeltaTrend;
}

/**
 * Calcula delta absoluto, porcentaje y tendencia.
 *
 * - Actual: Grupo A
 * - Referencia: Grupo B
 */
export function calculateDelta(
  currentValue: number,
  referenceValue: number,
): DeltaResult {
  const deltaAbs = currentValue - referenceValue;
  const deltaPercent =
    referenceValue !== 0 ? (deltaAbs / referenceValue) * 100 : Infinity;

  const trend: DeltaTrend =
    !isFinite(deltaPercent) || Math.abs(deltaPercent) < 1
      ? "neutral"
      : deltaPercent > 0
        ? "up"
        : "down";

  return {
    deltaAbs,
    deltaPercent,
    trend,
  };
}
