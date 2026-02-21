import type {
  CachedInsightsPayload,
  DashboardFilters,
  InsightCacheContext,
} from "@/modules/insights/domain/DatasetInsight.js";

export interface InsightsCacheRepository {
  findCached(
    datasetId: string,
    filters: DashboardFilters,
    context?: InsightCacheContext,
  ): Promise<CachedInsightsPayload | null>;

  saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    payload: CachedInsightsPayload,
    context?: InsightCacheContext,
  ): Promise<void>;

  invalidate(datasetId: string): Promise<void>;
}
