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
      { _source_group: "groupA", region: "north", revenue: 200 },
      { _source_group: "groupA", region: "south", revenue: 200 },
      { _source_group: "groupB", region: "north", revenue: 100 },
      { _source_group: "groupB", region: "south", revenue: 100 },
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
    expect((changeInsight?.metadata.change ?? 0) > 0).toBe(true);
  });

  it("returns negative change when groupA is below groupB", async () => {
    const datasetWithDecline: Dataset = {
      ...baseDataset,
      data: [
        { _source_group: "groupA", region: "north", revenue: 90 },
        { _source_group: "groupA", region: "south", revenue: 110 },
        { _source_group: "groupB", region: "north", revenue: 180 },
        { _source_group: "groupB", region: "south", revenue: 220 },
      ],
    };

    const insights = await adapter.generateInsights(datasetWithDecline, {
      categorical: {},
    });

    const trend = insights.find(
      (insight) => insight.type === "trend" || insight.type === "warning",
    );

    expect((trend?.metadata.change ?? 0) < 0).toBe(true);
  });

  it("builds comparative anomaly by dimension with group values in message", async () => {
    const insights = await adapter.generateInsights(baseDataset, {
      categorical: {},
    });

    const anomaly = insights.find(
      (insight) =>
        insight.type === "anomaly" && insight.metadata.dimension === "region",
    );

    expect(anomaly).toBeDefined();
    expect(anomaly?.message).toContain("2023");
    expect(anomaly?.message).toContain("2024");
    expect(anomaly?.message).toContain("vs");
    expect(Math.abs(anomaly?.metadata.change ?? 0)).toBeGreaterThanOrEqual(40);
  });

  it("does not create anomalies when one group has zero value", async () => {
    const datasetWithZeroBase: Dataset = {
      ...baseDataset,
      data: [
        { _source_group: "groupA", region: "north", revenue: 0 },
        { _source_group: "groupB", region: "north", revenue: 500 },
      ],
    };

    const insights = await adapter.generateInsights(datasetWithZeroBase, {
      categorical: {},
    });

    const anomalies = insights.filter((insight) => insight.type === "anomaly");
    expect(anomalies).toHaveLength(0);
  });

  it("adds summary insights for top countries and metrics to improve", async () => {
    const datasetWithCountryDimension: Dataset = {
      ...baseDataset,
      schemaMapping: {
        ...baseDataset.schemaMapping!,
        kpiFields: [
          {
            id: "kpi_revenue",
            columnName: "revenue",
            label: "Revenue",
            format: "currency",
          },
          {
            id: "kpi_applies",
            columnName: "applies",
            label: "Applies",
            format: "number",
          },
        ],
        categoricalFields: ["country"],
      },
      data: [
        {
          _source_group: "groupA",
          country: "CO",
          revenue: 240,
          applies: 30,
        },
        {
          _source_group: "groupB",
          country: "CO",
          revenue: 100,
          applies: 80,
        },
        {
          _source_group: "groupA",
          country: "MX",
          revenue: 180,
          applies: 25,
        },
        {
          _source_group: "groupB",
          country: "MX",
          revenue: 90,
          applies: 70,
        },
        {
          _source_group: "groupA",
          country: "AR",
          revenue: 120,
          applies: 20,
        },
        {
          _source_group: "groupB",
          country: "AR",
          revenue: 70,
          applies: 60,
        },
      ],
    };

    const insights = await adapter.generateInsights(
      datasetWithCountryDimension,
      {
        categorical: {},
      },
    );

    const topCountries = insights.find(
      (insight) => insight.title === "Top países con mejor desempeño",
    );

    expect(topCountries).toBeDefined();
    expect(topCountries?.message).toContain("CO");
    expect(topCountries?.message).toContain("MX");

    const improvement = insights.find(
      (insight) => insight.title === "Top métricas a mejorar",
    );

    expect(improvement).toBeDefined();
    expect(improvement?.message).toContain("Applies");
  });

  it("creates combined-dimension comparisons when multiple categorical fields exist", async () => {
    const datasetWithTwoDimensions: Dataset = {
      ...baseDataset,
      schemaMapping: {
        ...baseDataset.schemaMapping!,
        categoricalFields: ["region", "channel"],
      },
      data: [
        {
          _source_group: "groupA",
          region: "north",
          channel: "mail",
          revenue: 100,
        },
        {
          _source_group: "groupA",
          region: "north",
          channel: "push",
          revenue: 30,
        },
        {
          _source_group: "groupB",
          region: "north",
          channel: "mail",
          revenue: 320,
        },
        {
          _source_group: "groupB",
          region: "north",
          channel: "push",
          revenue: 5,
        },
      ],
    };

    const insights = await adapter.generateInsights(datasetWithTwoDimensions, {
      categorical: {},
    });

    const combined = insights.find(
      (insight) =>
        insight.type === "anomaly" &&
        insight.metadata.dimension === "__combined__",
    );

    expect(combined).toBeDefined();
    expect(combined?.message).toContain("region=north");
    expect(combined?.message).toMatch(/channel=(mail|push)/);
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
