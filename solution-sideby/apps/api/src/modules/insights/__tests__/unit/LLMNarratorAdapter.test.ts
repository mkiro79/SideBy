import { beforeEach, describe, expect, it, vi } from "vitest";
import { LLMNarratorAdapter } from "@/modules/insights/infrastructure/LLMNarratorAdapter.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import type { DatasetInsight } from "@/modules/insights/domain/DatasetInsight.js";

describe("LLMNarratorAdapter", () => {
  const now = new Date();

  const dataset: Dataset = {
    id: "dataset-1",
    ownerId: "owner-1",
    status: "ready",
    meta: {
      name: "Dataset",
      description: "Narrative dataset",
      createdAt: now,
      updatedAt: now,
    },
    sourceConfig: {
      groupA: {
        label: "2025",
        color: "#111111",
        originalFileName: "a.csv",
        rowCount: 3,
      },
      groupB: {
        label: "2026",
        color: "#222222",
        originalFileName: "b.csv",
        rowCount: 3,
      },
    },
    schemaMapping: {
      dimensionField: "country",
      kpiFields: [
        {
          id: "revenue",
          columnName: "revenue",
          label: "Revenue",
          format: "currency",
        },
      ],
      categoricalFields: ["country"],
    },
    data: [],
  };

  const insights: DatasetInsight[] = [
    {
      id: "1",
      datasetId: "dataset-1",
      type: "anomaly",
      severity: 4,
      icon: "🚨",
      title: "Brecha relevante en revenue",
      message: "País CO: 2025 100 vs 2026 200 (+100.0%).",
      metadata: {
        dimension: "country",
        kpi: "revenue",
        change: 100,
      },
      generatedBy: "rule-engine",
      confidence: 0.9,
      generatedAt: now,
    },
    {
      id: "2",
      datasetId: "dataset-1",
      type: "anomaly",
      severity: 4,
      icon: "🚨",
      title: "Brecha relevante en opens",
      message: "País MX: 2025 100 vs 2026 180 (+80.0%).",
      metadata: {
        dimension: "country",
        kpi: "opens",
        change: 80,
      },
      generatedBy: "rule-engine",
      confidence: 0.9,
      generatedAt: now,
    },
    {
      id: "3",
      datasetId: "dataset-1",
      type: "warning",
      severity: 3,
      icon: "⚠️",
      title: "Top métricas a mejorar",
      message: "Priorizar metrics",
      metadata: {
        kpi: "applies",
        change: -35,
      },
      generatedBy: "rule-engine",
      confidence: 0.9,
      generatedAt: now,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("injects top country and weakest metric context into prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "ok",
                recommendedActions: ["a", "b", "c", "d"],
                confidence: 0.8,
                language: "es",
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const adapter = new LLMNarratorAdapter({
      baseURL: "http://localhost:11434/v1",
      model: "qwen2.5:7b-instruct",
      apiKey: "ollama",
    });

    await adapter.generateNarrative({
      dataset,
      insights,
      language: "es",
      userContext: "context",
    });

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      messages: Array<{ role: string; content: string }>;
    };

    const userPrompt = callBody.messages.find(
      (message) => message.role === "user",
    )?.content;

    expect(userPrompt).toContain("Top 3 países con mejor señal");
    expect(userPrompt).toContain('"country": "CO"');
    expect(userPrompt).toContain("Top 3 métricas a mejorar");
    expect(userPrompt).toContain('"kpi": "applies"');
  });
});
