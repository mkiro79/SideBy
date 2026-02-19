import { describe, it, expect, beforeEach, vi } from "vitest";
import { GenerateInsightsUseCase } from "@/modules/insights/application/use-cases/GenerateInsightsUseCase.js";
import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import type { DatasetInsight } from "@/modules/insights/domain/DatasetInsight.js";
import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";
import type { InsightsGenerator } from "@/modules/insights/application/ports/InsightsGenerator.js";
import type { InsightsNarrator } from "@/modules/insights/application/ports/InsightsNarrator";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";

class MockDatasetRepository implements DatasetRepository {
  constructor(private readonly dataset: Dataset | null) {}

  async create(dataset: Omit<Dataset, "id">): Promise<Dataset> {
    return { ...dataset, id: "new-id" };
  }

  async findById(): Promise<Dataset | null> {
    return this.dataset;
  }

  async findByOwnerId(): Promise<Dataset[]> {
    return [];
  }

  async update(): Promise<Dataset> {
    throw new Error("Not implemented");
  }

  async delete(): Promise<void> {
    return;
  }

  async findAbandoned(): Promise<Dataset[]> {
    return [];
  }
}

describe("GenerateInsightsUseCase", () => {
  const now = new Date();

  const baseDataset: Dataset = {
    id: "dataset-1",
    ownerId: "owner-1",
    status: "ready",
    meta: {
      name: "Test dataset",
      createdAt: now,
      updatedAt: now,
    },
    sourceConfig: {
      groupA: {
        label: "A",
        color: "#111111",
        originalFileName: "a.csv",
        rowCount: 2,
      },
      groupB: {
        label: "B",
        color: "#222222",
        originalFileName: "b.csv",
        rowCount: 2,
      },
    },
    schemaMapping: {
      dimensionField: "region",
      kpiFields: [
        {
          id: "kpi_revenue",
          columnName: "revenue",
          label: "Revenue",
          format: "currency",
        },
      ],
      categoricalFields: ["region"],
    },
    aiConfig: {
      enabled: true,
    },
    data: [
      { _source_group: "groupA", region: "north", revenue: 100 },
      { _source_group: "groupB", region: "north", revenue: 140 },
    ],
  };

  const generatedInsight: DatasetInsight = {
    id: "insight-1",
    datasetId: "dataset-1",
    type: "summary",
    severity: 1,
    icon: "💡",
    title: "Resumen",
    message: "Mensaje",
    metadata: {},
    generatedBy: "rule-engine",
    confidence: 1,
    generatedAt: now,
  };

  let cacheRepository: InsightsCacheRepository;
  let ruleEngine: InsightsGenerator;
  let llmNarrator: InsightsNarrator;
  let generateNarrativeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cacheRepository = {
      findCached: vi.fn().mockResolvedValue(null),
      saveToCache: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    };

    ruleEngine = {
      generateInsights: vi.fn().mockResolvedValue([generatedInsight]),
    };

    generateNarrativeMock = vi.fn().mockResolvedValue({
      summary: "Resumen ejecutivo",
      recommendedActions: ["Acción 1", "Acción 2"],
      language: "es",
      generatedBy: "ai-model",
      generatedAt: new Date().toISOString(),
      confidence: 0.8,
    });

    llmNarrator = {
      generateNarrative:
        generateNarrativeMock as InsightsNarrator["generateNarrative"],
    };
  });

  it("returns cached insights when cache hit and forceRefresh is false", async () => {
    const cached = {
      insights: [{ ...generatedInsight, id: "cached-1" }],
      businessNarrative: {
        summary: "Narrativa cacheada",
        recommendedActions: ["Acción cacheada"],
        language: "es" as const,
        generatedBy: "ai-model" as const,
        confidence: 0.7,
        generatedAt: new Date().toISOString(),
      },
    };
    vi.mocked(cacheRepository.findCached).mockResolvedValueOnce(cached);

    const useCase = new GenerateInsightsUseCase(
      new MockDatasetRepository(baseDataset),
      cacheRepository,
      ruleEngine,
      llmNarrator,
      true,
    );

    const result = await useCase.execute({
      datasetId: "dataset-1",
      userId: "owner-1",
      filters: { categorical: {} },
      forceRefresh: false,
    });

    expect(result.fromCache).toBe(true);
    expect(result.insights).toEqual(cached.insights);
    expect(result.businessNarrative).toEqual(cached.businessNarrative);
    expect(ruleEngine.generateInsights).not.toHaveBeenCalled();
    expect(generateNarrativeMock).not.toHaveBeenCalled();
  });

  it("uses rule engine when global llm flag is disabled", async () => {
    const useCase = new GenerateInsightsUseCase(
      new MockDatasetRepository(baseDataset),
      cacheRepository,
      ruleEngine,
      llmNarrator,
      false,
    );

    const result = await useCase.execute({
      datasetId: "dataset-1",
      userId: "owner-1",
      filters: { categorical: {} },
      forceRefresh: false,
    });

    expect(result.fromCache).toBe(false);
    expect(ruleEngine.generateInsights).toHaveBeenCalledTimes(1);
    expect(generateNarrativeMock).not.toHaveBeenCalled();
    expect(cacheRepository.saveToCache).toHaveBeenCalledTimes(1);
    expect(result.businessNarrative).toBeUndefined();
    expect(result.narrativeStatus).toBe("not-requested");
  });

  it("always uses rule engine and adds narrative when global flag and dataset ai flag are enabled", async () => {
    const useCase = new GenerateInsightsUseCase(
      new MockDatasetRepository(baseDataset),
      cacheRepository,
      ruleEngine,
      llmNarrator,
      true,
    );

    const result = await useCase.execute({
      datasetId: "dataset-1",
      userId: "owner-1",
      filters: { categorical: {} },
      forceRefresh: true,
    });

    expect(result.fromCache).toBe(false);
    expect(ruleEngine.generateInsights).toHaveBeenCalledTimes(1);
    expect(generateNarrativeMock).toHaveBeenCalledTimes(1);
    expect(result.businessNarrative).toBeDefined();
    expect(result.narrativeStatus).toBe("generated");
  });

  it("uses feature flag insights to enable optional narrative", async () => {
    const datasetWithFeatureFlag: Dataset = {
      ...baseDataset,
      aiConfig: {
        enabled: false,
        enabledFeatures: {
          insights: true,
        },
      },
    };

    const useCase = new GenerateInsightsUseCase(
      new MockDatasetRepository(datasetWithFeatureFlag),
      cacheRepository,
      ruleEngine,
      llmNarrator,
      true,
    );

    const result = await useCase.execute({
      datasetId: "dataset-1",
      userId: "owner-1",
      filters: { categorical: {} },
      forceRefresh: true,
    });

    expect(result.fromCache).toBe(false);
    expect(ruleEngine.generateInsights).toHaveBeenCalledTimes(1);
    expect(generateNarrativeMock).toHaveBeenCalledTimes(1);
  });

  it("returns rules insights when narrative generation fails", async () => {
    generateNarrativeMock.mockRejectedValueOnce(new Error("llm down"));

    const useCase = new GenerateInsightsUseCase(
      new MockDatasetRepository(baseDataset),
      cacheRepository,
      ruleEngine,
      llmNarrator,
      true,
    );

    const result = await useCase.execute({
      datasetId: "dataset-1",
      userId: "owner-1",
      filters: { categorical: {} },
      forceRefresh: true,
    });

    expect(result.fromCache).toBe(false);
    expect(generateNarrativeMock).toHaveBeenCalledTimes(1);
    expect(ruleEngine.generateInsights).toHaveBeenCalledTimes(1);
    expect(result.insights[0]?.generatedBy).toBe("rule-engine");
    expect(result.businessNarrative).toBeUndefined();
    expect(result.narrativeStatus).toBe("fallback");
  });

  it("resolves narrative language from userContext and defaults to spanish", async () => {
    const datasetWithLanguage: Dataset = {
      ...baseDataset,
      aiConfig: {
        enabled: true,
        userContext: '{"language":"en"}',
      },
    };

    const useCase = new GenerateInsightsUseCase(
      new MockDatasetRepository(datasetWithLanguage),
      cacheRepository,
      ruleEngine,
      llmNarrator,
      true,
    );

    await useCase.execute({
      datasetId: "dataset-1",
      userId: "owner-1",
      filters: { categorical: {} },
      forceRefresh: true,
    });

    expect(generateNarrativeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "en",
      }),
    );
  });

  it("throws DatasetNotFoundError when dataset does not belong to user", async () => {
    const foreignDataset: Dataset = {
      ...baseDataset,
      ownerId: "another-owner",
    };

    const useCase = new GenerateInsightsUseCase(
      new MockDatasetRepository(foreignDataset),
      cacheRepository,
      ruleEngine,
      llmNarrator,
      true,
    );

    await expect(
      useCase.execute({
        datasetId: "dataset-1",
        userId: "owner-1",
        filters: { categorical: {} },
        forceRefresh: false,
      }),
    ).rejects.toThrow(DatasetNotFoundError);
  });
});
