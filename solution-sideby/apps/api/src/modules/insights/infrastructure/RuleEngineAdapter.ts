import { randomUUID } from "node:crypto";
import type {
  Dataset,
  DataRow,
  KPIField,
} from "@/modules/datasets/domain/Dataset.entity.js";
import type { InsightsGenerator } from "@/modules/insights/application/ports/InsightsGenerator.js";
import type {
  DashboardFilters,
  DatasetInsight,
} from "@/modules/insights/domain/DatasetInsight.js";

interface KpiSummary {
  name: string;
  label: string;
  groupA: number;
  groupB: number;
}

interface DimensionalOutlier {
  dimension: string;
  dimensionValue: string;
  kpi: string;
  groupA: number;
  groupB: number;
  value: number;
  dominantGroup: "groupA" | "groupB";
  change: number;
}

export class RuleEngineAdapter implements InsightsGenerator {
  private static readonly GLOBAL_CHANGE_THRESHOLD = 20;
  private static readonly DIMENSION_CHANGE_THRESHOLD = 15;
  private static readonly MAX_DIMENSION_INSIGHTS = 10;
  private static readonly TOP_ITEMS_LIMIT = 3;

  async generateInsights(
    dataset: Dataset,
    filters: DashboardFilters,
  ): Promise<DatasetInsight[]> {
    const filteredData = this.applyFilters(dataset.data, filters);

    const kpiFields = dataset.schemaMapping?.kpiFields ?? [];

    const kpis = this.calculateKPIs(filteredData, kpiFields);

    const insights: DatasetInsight[] = [];

    for (const kpi of kpis) {
      const changePercent = this.calculatePercentChange(kpi.groupA, kpi.groupB);

      if (Math.abs(changePercent) > RuleEngineAdapter.GLOBAL_CHANGE_THRESHOLD) {
        const isPositive = changePercent > 0;

        insights.push({
          id: randomUUID(),
          datasetId: dataset.id,
          type: isPositive ? "trend" : "warning",
          severity: Math.abs(changePercent) > 50 ? 4 : 3,
          icon: isPositive ? "📈" : "📉",
          title: isPositive
            ? `${kpi.label}: avance relevante`
            : `${kpi.label}: señal de alerta`,
          message: `${kpi.label} ${isPositive ? "mejora" : "cae"} ${Math.abs(changePercent).toFixed(1)}% (${dataset.sourceConfig.groupA.label}: ${this.formatNumber(kpi.groupA)} vs ${dataset.sourceConfig.groupB.label}: ${this.formatNumber(kpi.groupB)}).`,
          metadata: {
            kpi: kpi.name,
            change: changePercent,
          },
          generatedBy: "rule-engine",
          confidence: 0.95,
          generatedAt: new Date(),
        });
      }
    }

    const dimensionalComparisons = this.detectDimensionalComparisons(
      filteredData,
      dataset.schemaMapping?.categoricalFields ?? [],
      kpiFields,
    );

    for (const outlier of dimensionalComparisons.slice(
      0,
      RuleEngineAdapter.MAX_DIMENSION_INSIGHTS,
    )) {
      const dominantLabel =
        outlier.dominantGroup === "groupA"
          ? dataset.sourceConfig.groupA.label
          : dataset.sourceConfig.groupB.label;

      insights.push({
        id: randomUUID(),
        datasetId: dataset.id,
        type: "anomaly",
        severity: 4,
        icon: "🚨",
        title: `Brecha relevante en ${outlier.kpi}`,
        message: `${this.formatDimensionContext(outlier.dimension, outlier.dimensionValue)}: ${dataset.sourceConfig.groupA.label} ${this.formatNumber(outlier.groupA)} vs ${dataset.sourceConfig.groupB.label} ${this.formatNumber(outlier.groupB)} (${outlier.change > 0 ? "+" : ""}${outlier.change.toFixed(1)}%, domina ${dominantLabel}).`,
        metadata: {
          dimension: outlier.dimension,
          kpi: outlier.kpi,
          value: outlier.value,
          change: outlier.change,
        },
        generatedBy: "rule-engine",
        confidence: 0.85,
        generatedAt: new Date(),
      });
    }

    const topCountriesInsight = this.buildTopCountriesInsight(
      dataset,
      dimensionalComparisons,
    );
    if (topCountriesInsight) {
      insights.push(topCountriesInsight);
    }

    const improvementInsight = this.buildImprovementMetricsInsight(
      dataset,
      kpis,
    );
    if (improvementInsight) {
      insights.push(improvementInsight);
    }

    const overallChange = this.calculateOverallChange(kpis);

    insights.push({
      id: randomUUID(),
      datasetId: dataset.id,
      type: "summary",
      severity: 1,
      icon: "💡",
      title: "Resumen general",
      message: `En promedio, los KPIs ${overallChange > 0 ? "mejoraron" : "disminuyeron"} un ${Math.abs(overallChange).toFixed(1)}% respecto al período anterior.`,
      metadata: {
        change: overallChange,
      },
      generatedBy: "rule-engine",
      confidence: 1,
      generatedAt: new Date(),
    });

    return insights.sort((a, b) => b.severity - a.severity);
  }

  private applyFilters(data: DataRow[], filters: DashboardFilters): DataRow[] {
    if (!filters.categorical || Object.keys(filters.categorical).length === 0) {
      return data;
    }

    return data.filter((row) => {
      return Object.entries(filters.categorical ?? {}).every(
        ([field, values]) => {
          if (!values || values.length === 0) {
            return true;
          }

          return values.includes(String(row[field]));
        },
      );
    });
  }

  private calculateKPIs(data: DataRow[], kpiFields: KPIField[]): KpiSummary[] {
    return kpiFields.map((kpi) => {
      const groupA = data
        .filter((row) => row._source_group === "groupA")
        .reduce((sum, row) => sum + this.toNumber(row[kpi.columnName]), 0);

      const groupB = data
        .filter((row) => row._source_group === "groupB")
        .reduce((sum, row) => sum + this.toNumber(row[kpi.columnName]), 0);

      return {
        name: kpi.columnName,
        label: kpi.label,
        groupA,
        groupB,
      };
    });
  }

  private detectDimensionalComparisons(
    data: DataRow[],
    dimensions: string[],
    kpiFields: KPIField[],
  ): DimensionalOutlier[] {
    const expandedDimensions = this.expandDimensions(dimensions);
    const aggregates = new Map<
      string,
      {
        dimension: string;
        dimensionValue: string;
        kpi: string;
        groupA: number;
        groupB: number;
      }
    >();

    for (const row of data) {
      const sourceGroup = row._source_group === "groupB" ? "groupB" : "groupA";

      for (const dimension of expandedDimensions) {
        const dimensionValue = this.resolveDimensionValue(
          row,
          dimension,
          dimensions,
        );

        for (const kpi of kpiFields) {
          const value = this.toNumber(row[kpi.columnName]);
          const key = `${dimension}::${dimensionValue}::${kpi.columnName}`;
          const current = aggregates.get(key) ?? {
            dimension,
            dimensionValue,
            kpi: kpi.columnName,
            groupA: 0,
            groupB: 0,
          };

          if (sourceGroup === "groupA") {
            current.groupA += value;
          } else {
            current.groupB += value;
          }

          aggregates.set(key, current);
        }
      }
    }

    return [...aggregates.values()]
      .filter((aggregate) => aggregate.groupA > 0 && aggregate.groupB > 0)
      .map((aggregate) => {
        const change = this.calculatePercentChange(
          aggregate.groupA,
          aggregate.groupB,
        );
        const dominantGroup =
          aggregate.groupB >= aggregate.groupA ? "groupB" : "groupA";

        return {
          dimension: aggregate.dimension,
          dimensionValue: aggregate.dimensionValue,
          kpi: aggregate.kpi,
          groupA: aggregate.groupA,
          groupB: aggregate.groupB,
          value:
            dominantGroup === "groupA" ? aggregate.groupA : aggregate.groupB,
          dominantGroup: dominantGroup as "groupA" | "groupB",
          change,
        };
      })
      .filter(
        (comparison) =>
          Math.abs(comparison.change) >=
          RuleEngineAdapter.DIMENSION_CHANGE_THRESHOLD,
      )
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }

  private buildTopCountriesInsight(
    dataset: Dataset,
    comparisons: DimensionalOutlier[],
  ): DatasetInsight | null {
    const countryComparisons = comparisons.filter(
      (comparison) =>
        comparison.dimension === "country" && comparison.change > 0,
    );

    if (countryComparisons.length === 0) {
      return null;
    }

    const strongestByCountry = new Map<string, DimensionalOutlier>();
    for (const comparison of countryComparisons) {
      const current = strongestByCountry.get(comparison.dimensionValue);
      if (!current || comparison.change > current.change) {
        strongestByCountry.set(comparison.dimensionValue, comparison);
      }
    }

    const topCountries = [...strongestByCountry.values()]
      .sort((a, b) => b.change - a.change)
      .slice(0, RuleEngineAdapter.TOP_ITEMS_LIMIT);

    if (topCountries.length === 0) {
      return null;
    }

    const highlights = topCountries
      .map(
        (item) =>
          `${item.dimensionValue} (${item.kpi} ${item.change > 0 ? "+" : ""}${item.change.toFixed(1)}%)`,
      )
      .join(", ");

    return {
      id: randomUUID(),
      datasetId: dataset.id,
      type: "suggestion",
      severity: 2,
      icon: "✅",
      title: "Top países con mejor desempeño",
      message: `Países que más destacan: ${highlights}.`,
      metadata: {
        dimension: "country",
      },
      generatedBy: "rule-engine",
      confidence: 0.9,
      generatedAt: new Date(),
    };
  }

  private buildImprovementMetricsInsight(
    dataset: Dataset,
    kpis: KpiSummary[],
  ): DatasetInsight | null {
    const weakestKpis = kpis
      .map((kpi) => ({
        name: kpi.name,
        label: kpi.label,
        change: this.calculatePercentChange(kpi.groupA, kpi.groupB),
      }))
      .filter((kpi) => kpi.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, RuleEngineAdapter.TOP_ITEMS_LIMIT);

    if (weakestKpis.length === 0) {
      return null;
    }

    const summary = weakestKpis
      .map(
        (item) =>
          `${item.label} (${item.change > 0 ? "+" : ""}${item.change.toFixed(1)}%)`,
      )
      .join(", ");

    return {
      id: randomUUID(),
      datasetId: dataset.id,
      type: "warning",
      severity: 3,
      icon: "⚠️",
      title: "Top métricas a mejorar",
      message: `Priorizar estas métricas en caída: ${summary}.`,
      metadata: {
        kpi: weakestKpis[0]?.name,
        change: weakestKpis[0]?.change,
      },
      generatedBy: "rule-engine",
      confidence: 0.9,
      generatedAt: new Date(),
    };
  }

  private calculateOverallChange(kpis: KpiSummary[]): number {
    if (kpis.length === 0) {
      return 0;
    }

    const changes = kpis.map((kpi) =>
      this.calculatePercentChange(kpi.groupA, kpi.groupB),
    );

    return changes.reduce((sum, value) => sum + value, 0) / changes.length;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private calculatePercentChange(
    currentValue: number,
    referenceValue: number,
  ): number {
    if (referenceValue > 0) {
      return ((currentValue - referenceValue) / referenceValue) * 100;
    }

    if (currentValue > 0) {
      return 100;
    }

    return 0;
  }

  private expandDimensions(dimensions: string[]): string[] {
    if (dimensions.length <= 1) {
      return dimensions;
    }

    return [...dimensions, "__combined__"];
  }

  private resolveDimensionValue(
    row: DataRow,
    dimension: string,
    baseDimensions: string[],
  ): string {
    if (dimension !== "__combined__") {
      return String(row[dimension] ?? "N/A");
    }

    return baseDimensions
      .map(
        (currentDimension) =>
          `${currentDimension}=${String(row[currentDimension] ?? "N/A")}`,
      )
      .join(" | ");
  }

  private formatNumber(value: number): string {
    return value.toLocaleString("es-ES", {
      maximumFractionDigits: 0,
    });
  }

  private formatDimensionContext(
    dimension: string,
    dimensionValue: string,
  ): string {
    if (dimension === "__combined__") {
      return `Combinación ${dimensionValue}`;
    }

    if (dimension === "country") {
      return `País ${dimensionValue}`;
    }

    return `${dimension} ${dimensionValue}`;
  }
}
