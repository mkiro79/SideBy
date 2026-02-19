import type {
  DatasetInsight,
  DashboardFilters,
} from "@/modules/insights/domain/DatasetInsight.js";

export interface InsightsCacheRepository {
  findCached(
    datasetId: string,
    filters: DashboardFilters,
  ): Promise<DatasetInsight[] | null>;

  saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    insights: DatasetInsight[],
  ): Promise<void>;

  invalidate(datasetId: string): Promise<void>;
}
