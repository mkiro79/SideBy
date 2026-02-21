import { describe, expect, it, vi } from "vitest";
import { InsightCacheManager } from "@/modules/insights/infrastructure/InsightCacheManager.js";
import { MongoInsightsCacheRepository } from "@/modules/insights/infrastructure/MongoInsightsCacheRepository.js";

describe("MongoInsightsCacheRepository", () => {
  it("uses semantic key to retrieve cached payload", async () => {
    const cacheManager = new InsightCacheManager();
    const cacheKey = cacheManager.generateCacheKey("65f8cc5b06fcd02b3f7c9123", {
      filters: { categorical: { country: ["CO"] } },
      language: "es",
      promptVersion: "v1",
    });

    const lean = vi.fn().mockResolvedValue({
      cacheKey,
      summary: {
        insights: [],
        narrativeStatus: "generated",
      },
    });

    const cacheModel = {
      findOne: vi.fn().mockReturnValue({ lean }),
      updateOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    const repository = new MongoInsightsCacheRepository(
      cacheManager,
      cacheModel,
    );

    const result = await repository.findCached(
      "65f8cc5b06fcd02b3f7c9123",
      { categorical: { country: ["CO"] } },
      { language: "es", promptVersion: "v1" },
    );

    expect(cacheModel.findOne).toHaveBeenCalledWith({ cacheKey });
    expect(result).toEqual({ insights: [], narrativeStatus: "generated" });
  });

  it("upserts cache snapshot and supports dataset invalidation", async () => {
    const cacheModel = {
      findOne: vi.fn().mockReturnValue({ lean: vi.fn() }),
      updateOne: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({}),
    };

    const repository = new MongoInsightsCacheRepository(
      new InsightCacheManager(),
      cacheModel,
    );

    await repository.saveToCache(
      "65f8cc5b06fcd02b3f7c9123",
      { categorical: {} },
      { insights: [], narrativeStatus: "not-requested" },
      { language: "en", promptVersion: "v2" },
    );

    expect(cacheModel.updateOne).toHaveBeenCalledTimes(1);

    await repository.invalidate("65f8cc5b06fcd02b3f7c9123");

    expect(cacheModel.deleteMany).toHaveBeenCalledTimes(1);
  });
});
