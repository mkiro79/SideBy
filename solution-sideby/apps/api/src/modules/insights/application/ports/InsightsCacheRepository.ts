import type {
  CachedInsightsPayload,
  DashboardFilters,
} from "@/modules/insights/domain/DatasetInsight.js";

export interface InsightsCacheRepository {
  findCached(
    datasetId: string,
    filters: DashboardFilters,
  ): Promise<CachedInsightsPayload | null>;

  saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    payload: CachedInsightsPayload,
  ): Promise<void>;

  invalidate(datasetId: string): Promise<void>;
}
