import type { DashboardFilters } from "../types/dashboard.types.js";

type CategoricalFilters = DashboardFilters["categorical"];

/**
 * Normaliza los filtros categóricos ordenando las claves y los valores de forma
 * consistente para garantizar comparaciones estables independientes del orden.
 *
 * @param filters - Filtros categóricos a normalizar.
 * @returns Objeto de filtros con claves y valores ordenados alfabéticamente.
 */
function normalizeCategoricalFilters(
  filters: CategoricalFilters,
): CategoricalFilters {
  const normalizedEntries = Object.entries(filters)
    .map(([key, values]) => [key, [...values].sort()] as const)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  return Object.fromEntries(normalizedEntries);
}

/**
 * Genera una clave de caché estable a partir de los filtros categóricos,
 * normalizando el orden de claves y valores para que filtros con los mismos
 * valores en distinto orden produzcan la misma clave.
 *
 * @param filters - Filtros categóricos a convertir en clave.
 * @returns Cadena JSON serializada y normalizada que representa los filtros.
 */
export function buildInsightsCategoricalKey(
  filters: CategoricalFilters,
): string {
  return JSON.stringify(normalizeCategoricalFilters(filters));
}

/**
 * Determina si los filtros categóricos han cambiado comparando sus claves
 * normalizadas, ignorando diferencias de orden en claves y valores.
 *
 * @param previousFilters - Filtros categóricos anteriores.
 * @param nextFilters - Nuevos filtros categóricos a comparar.
 * @returns `true` si los filtros han cambiado, `false` si son equivalentes.
 */
export function hasCategoricalFiltersChanged(
  previousFilters: CategoricalFilters,
  nextFilters: CategoricalFilters,
): boolean {
  return (
    buildInsightsCategoricalKey(previousFilters) !==
    buildInsightsCategoricalKey(nextFilters)
  );
}

/**
 * Construye el objeto de filtros que se enviará en la petición de insights,
 * incluyendo únicamente los filtros categóricos (excluye `periodFilter` y
 * cualquier otra propiedad de `DashboardFilters`).
 *
 * @param filters - Filtros completos del dashboard.
 * @returns Objeto con solo la propiedad `categorical`, normalizada.
 */
export function buildInsightsRequestFilters(
  filters: DashboardFilters,
): DashboardFilters {
  return {
    categorical: normalizeCategoricalFilters(filters.categorical),
  };
}
