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
  value: number;
  change: number;
}

export class RuleEngineAdapter implements InsightsGenerator {
  async generateInsights(
    dataset: Dataset,
    filters: DashboardFilters,
  ): Promise<DatasetInsight[]> {
    const filteredData = this.applyFilters(dataset.data, filters);

    const kpiFields = dataset.schemaMapping?.kpiFields ?? [];

    const kpis = this.calculateKPIs(filteredData, kpiFields);

    const insights: DatasetInsight[] = [];

    for (const kpi of kpis) {
      const changePercent =
        kpi.groupA !== 0 ? ((kpi.groupB - kpi.groupA) / kpi.groupA) * 100 : 0;

      if (Math.abs(changePercent) > 30) {
        const isPositive = changePercent > 0;

        insights.push({
          id: randomUUID(),
          datasetId: dataset.id,
          type: isPositive ? "trend" : "warning",
          severity: Math.abs(changePercent) > 50 ? 4 : 3,
          icon: isPositive ? "📈" : "📉",
          title: `${kpi.label}: Cambio significativo`,
          message: `${kpi.label} ${isPositive ? "aumentó" : "disminuyó"} un ${Math.abs(changePercent).toFixed(1)}% respecto al período anterior.`,
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

    const dimensionalOutliers = this.detectDimensionalOutliers(
      filteredData,
      dataset.schemaMapping?.categoricalFields ?? [],
      kpiFields,
    );

    for (const outlier of dimensionalOutliers) {
      insights.push({
        id: randomUUID(),
        datasetId: dataset.id,
        type: "anomaly",
        severity: 4,
        icon: "🚨",
        title: `Anomalía detectada en ${outlier.dimension}`,
        message: `${outlier.dimensionValue} muestra un comportamiento atípico en ${outlier.kpi} (${outlier.change > 0 ? "+" : ""}${outlier.change.toFixed(1)}%).`,
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

    const topPerformer = this.findTopPerformer(
      filteredData,
      dataset.schemaMapping?.categoricalFields ?? [],
      kpiFields,
    );

    if (topPerformer) {
      insights.push({
        id: randomUUID(),
        datasetId: dataset.id,
        type: "suggestion",
        severity: 2,
        icon: "✨",
        title: `Mejor rendimiento: ${topPerformer.dimensionValue}`,
        message: `${topPerformer.dimension} "${topPerformer.dimensionValue}" lidera con ${topPerformer.value.toFixed(0)} en ${topPerformer.kpi}.`,
        metadata: {
          dimension: topPerformer.dimension,
          kpi: topPerformer.kpi,
          value: topPerformer.value,
        },
        generatedBy: "rule-engine",
        confidence: 1,
        generatedAt: new Date(),
      });
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

  private detectDimensionalOutliers(
    data: DataRow[],
    dimensions: string[],
    kpiFields: KPIField[],
  ): DimensionalOutlier[] {
    const outliers: DimensionalOutlier[] = [];

    for (const dimension of dimensions) {
      for (const kpi of kpiFields) {
        const grouped = this.groupByDimension(data, dimension, kpi.columnName);
        const values = Object.values(grouped);

        if (values.length < 2) {
          continue;
        }

        const mean = this.calculateMean(values);
        const stdDev = this.calculateStdDev(values, mean);

        if (stdDev === 0 || mean === 0) {
          continue;
        }

        for (const [dimensionValue, value] of Object.entries(grouped)) {
          const zScore = Math.abs((value - mean) / stdDev);

          if (zScore > 2) {
            outliers.push({
              dimension,
              dimensionValue,
              kpi: kpi.columnName,
              value,
              change: ((value - mean) / mean) * 100,
            });
          }
        }
      }
    }

    return outliers;
  }

  private findTopPerformer(
    data: DataRow[],
    dimensions: string[],
    kpiFields: KPIField[],
  ): DimensionalOutlier | null {
    const dimension = dimensions[0];
    const kpi = kpiFields[0]?.columnName;

    if (!dimension || !kpi) {
      return null;
    }

    const grouped = this.groupByDimension(data, dimension, kpi);

    let bestEntry: [string, number] | null = null;

    for (const entry of Object.entries(grouped)) {
      if (!bestEntry || entry[1] > bestEntry[1]) {
        bestEntry = entry;
      }
    }

    if (!bestEntry) {
      return null;
    }

    return {
      dimension,
      dimensionValue: bestEntry[0],
      kpi,
      value: bestEntry[1],
      change: 0,
    };
  }

  private groupByDimension(
    data: DataRow[],
    dimension: string,
    kpi: string,
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const row of data) {
      const key = String(row[dimension] ?? "N/A");
      if (!grouped[key]) {
        grouped[key] = 0;
      }
      grouped[key] += this.toNumber(row[kpi]);
    }

    return grouped;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      values.length;

    return Math.sqrt(variance);
  }

  private calculateOverallChange(kpis: KpiSummary[]): number {
    if (kpis.length === 0) {
      return 0;
    }

    const changes = kpis.map((kpi) =>
      kpi.groupA !== 0 ? ((kpi.groupB - kpi.groupA) / kpi.groupA) * 100 : 0,
    );

    return changes.reduce((sum, value) => sum + value, 0) / changes.length;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
