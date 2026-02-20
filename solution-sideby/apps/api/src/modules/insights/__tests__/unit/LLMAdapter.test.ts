import { beforeEach, describe, expect, it, vi } from "vitest";
import logger from "@/utils/logger.js";
import { LLMAdapter } from "@/modules/insights/infrastructure/LLMAdapter.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";

vi.mock("@/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LLMAdapter", () => {
  const now = new Date();

  const baseDataset: Dataset = {
    id: "dataset-1",
    ownerId: "owner-1",
    status: "ready",
    meta: {
      name: "Dataset owner@mail.com",
      description: "KPI overview",
      createdAt: now,
      updatedAt: now,
    },
    sourceConfig: {
      groupA: {
        label: "Group A",
        color: "#111111",
        originalFileName: "a.csv",
        rowCount: 2,
      },
      groupB: {
        label: "Group B",
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
    data: [
      { _source_group: "groupA", region: "north", revenue: 100 },
      { _source_group: "groupB", region: "north", revenue: 120 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sanitizes prompt payload before sending to llm", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: [
                  {
                    type: "summary",
                    severity: 1,
                    title: "Resumen",
                    message: "Todo bien",
                    metadata: {},
                    confidence: 0.8,
                  },
                ],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const adapter = new LLMAdapter({
      baseURL: "http://localhost:11434/v1",
      model: "qwen2.5:7b-instruct",
      apiKey: "ollama",
    });

    await adapter.generateInsights(baseDataset, {
      categorical: {
        "owner@mail.com": ["customer-123456789"],
      },
    });

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      messages: Array<{ role: string; content: string }>;
    };

    const userPrompt = callBody.messages.find(
      (message) => message.role === "user",
    )?.content;

    expect(userPrompt).toContain("[REDACTED_EMAIL]");
    expect(userPrompt).toContain("[REDACTED_NUMBER]");
    expect(userPrompt).not.toContain("owner@mail.com");
    expect(userPrompt).not.toContain("123456789");
  });

  it("logs usage metrics for cost tracking", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        usage: {
          prompt_tokens: 120,
          completion_tokens: 80,
          total_tokens: 200,
        },
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: [
                  {
                    type: "trend",
                    severity: 3,
                    title: "Revenue up",
                    message: "Revenue improved",
                    metadata: { kpi: "revenue", change: 20 },
                    confidence: 0.9,
                  },
                ],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const adapter = new LLMAdapter({
      baseURL: "http://localhost:11434/v1",
      model: "qwen2.5:7b-instruct",
      apiKey: "ollama",
    });

    await adapter.generateInsights(baseDataset, {
      categorical: {},
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetId: "dataset-1",
        model: "qwen2.5:7b-instruct",
        usage: {
          promptTokens: 120,
          completionTokens: 80,
          totalTokens: 200,
        },
      }),
      "LLM insights generated",
    );
  });

  it("does not send authorization header when api key is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: [],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const adapter = new LLMAdapter({
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      apiKey: "",
    });

    await adapter.generateInsights(baseDataset, {
      categorical: {},
    });

    const requestInit = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
    };

    expect(requestInit.headers.Authorization).toBeUndefined();
    expect(requestInit.headers["Content-Type"]).toBe("application/json");
  });

  it("includes userContext in generated prompt when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: [],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const adapter = new LLMAdapter({
      baseURL: "http://localhost:11434/v1",
      model: "qwen2.5:7b-instruct",
      apiKey: "ollama",
    });

    await adapter.generateInsights(
      {
        ...baseDataset,
        aiConfig: {
          enabled: true,
          userContext: "Prioriza retención y conversión en campañas de email",
        },
      },
      {
        categorical: {},
      },
    );

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      messages: Array<{ role: string; content: string }>;
    };

    const userPrompt = callBody.messages.find(
      (message) => message.role === "user",
    )?.content;

    expect(userPrompt).toContain(
      "Prioriza retención y conversión en campañas de email",
    );
  });
});
