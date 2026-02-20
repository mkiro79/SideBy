import type { DashboardFilters } from "../types/dashboard.types.js";

type CategoricalFilters = DashboardFilters["categorical"];

function normalizeCategoricalFilters(
  filters: CategoricalFilters,
): CategoricalFilters {
  const normalizedEntries = Object.entries(filters)
    .map(([key, values]) => [key, [...values].sort()] as const)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  return Object.fromEntries(normalizedEntries);
}

export function buildInsightsCategoricalKey(
  filters: CategoricalFilters,
): string {
  return JSON.stringify(normalizeCategoricalFilters(filters));
}

export function hasCategoricalFiltersChanged(
  previousFilters: CategoricalFilters,
  nextFilters: CategoricalFilters,
): boolean {
  return (
    buildInsightsCategoricalKey(previousFilters) !==
    buildInsightsCategoricalKey(nextFilters)
  );
}

export function buildInsightsRequestFilters(
  filters: DashboardFilters,
): DashboardFilters {
  return {
    categorical: normalizeCategoricalFilters(filters.categorical),
  };
}
