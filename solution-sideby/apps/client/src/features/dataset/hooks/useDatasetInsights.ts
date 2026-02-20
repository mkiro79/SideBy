import { useQuery } from "@tanstack/react-query";
import { getDatasetInsights } from "../services/datasets.api.js";
import type { DashboardFilters } from "../types/dashboard.types.js";

interface UseDatasetInsightsOptions {
  enabled?: boolean;
}

export function useDatasetInsights(
  datasetId: string,
  filters: DashboardFilters,
  options?: UseDatasetInsightsOptions,
) {
  const query = useQuery({
    queryKey: ["datasetInsights", datasetId, filters],
    queryFn: () => getDatasetInsights(datasetId, filters),
    enabled: Boolean(datasetId) && Boolean(options?.enabled),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchInsights = () => {
    if (!datasetId) {
      return Promise.resolve(
        undefined as unknown as Awaited<ReturnType<typeof query.refetch>>,
      );
    }

    return query.refetch();
  };

  return {
    ...query,
    fetchInsights,
  };
}
