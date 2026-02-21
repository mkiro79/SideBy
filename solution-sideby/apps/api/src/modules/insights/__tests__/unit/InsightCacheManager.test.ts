import { describe, expect, it } from "vitest";
import { InsightCacheManager } from "@/modules/insights/infrastructure/InsightCacheManager.js";

describe("InsightCacheManager", () => {
  const manager = new InsightCacheManager();

  it("generates same key for equivalent filters with different key order", () => {
    const datasetId = "65f8cc5b06fcd02b3f7c9123";

    const keyA = manager.generateCacheKey(datasetId, {
      filters: {
        categorical: {
          country: ["CO", "MX"],
          source: ["push"],
        },
      },
      language: "es",
      promptVersion: "v1",
    });

    const keyB = manager.generateCacheKey(datasetId, {
      language: "es",
      promptVersion: "v1",
      filters: {
        categorical: {
          source: ["push"],
          country: ["CO", "MX"],
        },
      },
    });

    expect(keyA).toBe(keyB);
  });

  it("generates same key when array filter values are in different order", () => {
    const datasetId = "65f8cc5b06fcd02b3f7c9123";

    const keyA = manager.generateCacheKey(datasetId, {
      filters: {
        categorical: {
          country: ["CO", "MX"],
        },
      },
      language: "es",
      promptVersion: "v1",
    });

    const keyB = manager.generateCacheKey(datasetId, {
      filters: {
        categorical: {
          country: ["MX", "CO"],
        },
      },
      language: "es",
      promptVersion: "v1",
    });

    expect(keyA).toBe(keyB);
  });

  it("generates different keys for different language or prompt version", () => {
    const datasetId = "65f8cc5b06fcd02b3f7c9123";
    const filters = {
      categorical: {
        country: ["CO"],
      },
    };

    const esKey = manager.generateCacheKey(datasetId, {
      filters,
      language: "es",
      promptVersion: "v1",
    });
    const enKey = manager.generateCacheKey(datasetId, {
      filters,
      language: "en",
      promptVersion: "v1",
    });
    const version2Key = manager.generateCacheKey(datasetId, {
      filters,
      language: "es",
      promptVersion: "v2",
    });

    expect(esKey).not.toBe(enKey);
    expect(esKey).not.toBe(version2Key);
  });
});
