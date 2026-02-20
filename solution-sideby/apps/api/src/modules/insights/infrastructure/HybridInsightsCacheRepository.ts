import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";
import type {
  CachedInsightsPayload,
  DashboardFilters,
  InsightCacheContext,
} from "@/modules/insights/domain/DatasetInsight.js";

export class HybridInsightsCacheRepository implements InsightsCacheRepository {
  constructor(
    private readonly memoryCacheRepository: InsightsCacheRepository,
    private readonly persistentCacheRepository: InsightsCacheRepository,
  ) {}

  async findCached(
    datasetId: string,
    filters: DashboardFilters,
    context?: InsightCacheContext,
  ): Promise<CachedInsightsPayload | null> {
    const memoryPayload = await this.memoryCacheRepository.findCached(
      datasetId,
      filters,
      context,
    );

    if (memoryPayload) {
      return memoryPayload;
    }

    const persistentPayload = await this.persistentCacheRepository.findCached(
      datasetId,
      filters,
      context,
    );

    if (persistentPayload) {
      await this.memoryCacheRepository.saveToCache(
        datasetId,
        filters,
        persistentPayload,
        context,
      );
      return persistentPayload;
    }

    return null;
  }

  async saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    payload: CachedInsightsPayload,
    context?: InsightCacheContext,
  ): Promise<void> {
    await this.memoryCacheRepository.saveToCache(
      datasetId,
      filters,
      payload,
      context,
    );
    await this.persistentCacheRepository.saveToCache(
      datasetId,
      filters,
      payload,
      context,
    );
  }

  async invalidate(datasetId: string): Promise<void> {
    await this.memoryCacheRepository.invalidate(datasetId);
    await this.persistentCacheRepository.invalidate(datasetId);
  }
}
