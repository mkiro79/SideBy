import { describe, it, expect } from "vitest";
import { RuleEngineAdapter } from "@/modules/insights/infrastructure/RuleEngineAdapter.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";

describe("RuleEngineAdapter", () => {
  const adapter = new RuleEngineAdapter();
  const now = new Date();

  const baseDataset: Dataset = {
    id: "dataset-1",
    ownerId: "owner-1",
    status: "ready",
    meta: {
      name: "Dataset",
      createdAt: now,
      updatedAt: now,
    },
    sourceConfig: {
      groupA: {
        label: "2023",
        color: "#111111",
        originalFileName: "a.csv",
        rowCount: 3,
      },
      groupB: {
        label: "2024",
        color: "#222222",
        originalFileName: "b.csv",
        rowCount: 3,
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
      { _source_group: "groupA", region: "south", revenue: 100 },
      { _source_group: "groupB", region: "north", revenue: 200 },
      { _source_group: "groupB", region: "south", revenue: 200 },
    ],
  };

  it("always includes summary insight", async () => {
    const insights = await adapter.generateInsights(baseDataset, {
      categorical: {},
    });

    const summary = insights.find((insight) => insight.type === "summary");
    expect(summary).toBeDefined();
    expect(summary?.generatedBy).toBe("rule-engine");
  });

  it("detects significant kpi changes above 30%", async () => {
    const insights = await adapter.generateInsights(baseDataset, {
      categorical: {},
    });

    const changeInsight = insights.find(
      (insight) => insight.type === "trend" || insight.type === "warning",
    );

    expect(changeInsight).toBeDefined();
    expect(Math.abs(changeInsight?.metadata.change ?? 0)).toBeGreaterThan(30);
  });

  it("applies categorical filters before calculating insights", async () => {
    const insights = await adapter.generateInsights(baseDataset, {
      categorical: {
        region: ["north"],
      },
    });

    expect(insights.length).toBeGreaterThan(0);
    const trendInsight = insights.find(
      (insight) => insight.type === "trend" || insight.type === "warning",
    );

    expect(trendInsight).toBeDefined();
    expect(trendInsight?.metadata.kpi).toBe("revenue");
  });

  it("returns summary only when dataset has no schema mapping", async () => {
    const datasetWithoutMapping: Dataset = {
      ...baseDataset,
      schemaMapping: undefined,
    };

    const insights = await adapter.generateInsights(datasetWithoutMapping, {
      categorical: {},
    });

    expect(insights).toHaveLength(1);
    expect(insights[0]?.type).toBe("summary");
  });
});
