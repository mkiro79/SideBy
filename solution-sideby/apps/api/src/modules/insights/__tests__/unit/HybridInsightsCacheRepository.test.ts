import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CachedInsightsPayload,
  DashboardFilters,
} from "@/modules/insights/domain/DatasetInsight.js";
import { HybridInsightsCacheRepository } from "@/modules/insights/infrastructure/HybridInsightsCacheRepository.js";
import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";

describe("HybridInsightsCacheRepository", () => {
  const payload: CachedInsightsPayload = {
    insights: [],
    narrativeStatus: "not-requested",
  };
  const filters: DashboardFilters = {
    categorical: {
      country: ["CO"],
    },
  };

  let memoryCache: InsightsCacheRepository;
  let persistentCache: InsightsCacheRepository;

  beforeEach(() => {
    memoryCache = {
      findCached: vi.fn().mockResolvedValue(null),
      saveToCache: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    };

    persistentCache = {
      findCached: vi.fn().mockResolvedValue(null),
      saveToCache: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("returns memory cache result when available", async () => {
    vi.mocked(memoryCache.findCached).mockResolvedValueOnce(payload);

    const repository = new HybridInsightsCacheRepository(
      memoryCache,
      persistentCache,
    );

    const result = await repository.findCached("dataset-1", filters, {
      language: "es",
      promptVersion: "v1",
    });

    expect(result).toEqual(payload);
    expect(memoryCache.findCached).toHaveBeenCalledTimes(1);
    expect(persistentCache.findCached).not.toHaveBeenCalled();
  });

  it("uses persistent cache when memory misses and warms memory cache", async () => {
    vi.mocked(persistentCache.findCached).mockResolvedValueOnce(payload);

    const repository = new HybridInsightsCacheRepository(
      memoryCache,
      persistentCache,
    );

    const result = await repository.findCached("dataset-1", filters, {
      language: "es",
      promptVersion: "v1",
    });

    expect(result).toEqual(payload);
    expect(persistentCache.findCached).toHaveBeenCalledTimes(1);
    expect(memoryCache.saveToCache).toHaveBeenCalledWith(
      "dataset-1",
      filters,
      payload,
      {
        language: "es",
        promptVersion: "v1",
      },
    );
  });

  it("persists cache in memory and persistent layers", async () => {
    const repository = new HybridInsightsCacheRepository(
      memoryCache,
      persistentCache,
    );

    await repository.saveToCache("dataset-1", filters, payload, {
      language: "es",
      promptVersion: "v1",
    });

    expect(memoryCache.saveToCache).toHaveBeenCalledTimes(1);
    expect(persistentCache.saveToCache).toHaveBeenCalledTimes(1);
  });
});
