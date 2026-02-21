import type {
  CachedInsightsPayload,
  DashboardFilters,
  InsightCacheContext,
} from "@/modules/insights/domain/DatasetInsight.js";
import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";

interface CachedEntry {
  expiresAt: number;
  payload: CachedInsightsPayload;
}

export class InMemoryInsightsCacheRepository implements InsightsCacheRepository {
  private readonly cache = new Map<string, CachedEntry>();

  constructor(private readonly ttlSeconds = 300) {}

  async findCached(
    datasetId: string,
    filters: DashboardFilters,
    context?: InsightCacheContext,
  ): Promise<CachedInsightsPayload | null> {
    const key = this.generateCacheKey(datasetId, filters, context);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.payload;
  }

  async saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    payload: CachedInsightsPayload,
    context?: InsightCacheContext,
  ): Promise<void> {
    const key = this.generateCacheKey(datasetId, filters, context);

    this.cache.set(key, {
      payload,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  async invalidate(datasetId: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`insights:${datasetId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  private generateCacheKey(
    datasetId: string,
    filters: DashboardFilters,
    context?: InsightCacheContext,
  ): string {
    const language = context?.language ?? "es";
    const promptVersion = context?.promptVersion ?? "v1";
    return `insights:${datasetId}:${language}:${promptVersion}:${JSON.stringify(filters)}`;
  }
}
