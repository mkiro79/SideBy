import type {
  DashboardFilters,
  DatasetInsight,
} from "@/modules/insights/domain/DatasetInsight.js";
import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";

interface CachedEntry {
  expiresAt: number;
  insights: DatasetInsight[];
}

export class InMemoryInsightsCacheRepository implements InsightsCacheRepository {
  private readonly cache = new Map<string, CachedEntry>();

  constructor(private readonly ttlSeconds = 300) {}

  async findCached(
    datasetId: string,
    filters: DashboardFilters,
  ): Promise<DatasetInsight[] | null> {
    const key = this.generateCacheKey(datasetId, filters);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.insights;
  }

  async saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    insights: DatasetInsight[],
  ): Promise<void> {
    const key = this.generateCacheKey(datasetId, filters);

    this.cache.set(key, {
      insights,
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

  private generateCacheKey(datasetId: string, filters: DashboardFilters): string {
    return `insights:${datasetId}:${JSON.stringify(filters)}`;
  }
}
