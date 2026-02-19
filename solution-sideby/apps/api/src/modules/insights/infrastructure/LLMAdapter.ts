import { randomUUID } from "node:crypto";
import type { Dataset, KPIField } from "@/modules/datasets/domain/Dataset.entity.js";
import type { InsightsGenerator } from "@/modules/insights/application/ports/InsightsGenerator.js";
import type {
  DashboardFilters,
  DatasetInsight,
  InsightType,
} from "@/modules/insights/domain/DatasetInsight.js";

interface LLMAdapterConfig {
  baseURL: string;
  model: string;
  apiKey?: string;
  timeoutMs?: number;
}

interface LLMResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class LLMAdapter implements InsightsGenerator {
  private readonly timeoutMs: number;

  constructor(private readonly config: LLMAdapterConfig) {
    this.timeoutMs = config.timeoutMs ?? 5000;
  }

  async generateInsights(
    dataset: Dataset,
    filters: DashboardFilters,
  ): Promise<DatasetInsight[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const summary = this.prepareDataSummary(dataset, filters);

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey ?? "ollama"}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Eres un analista de datos experto. Devuelve exclusivamente JSON válido con clave insights.",
            },
            {
              role: "user",
              content: this.buildPrompt(dataset, summary),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM request failed with status ${response.status}`);
      }

      const data = (await response.json()) as LLMResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty LLM response");
      }

      const parsed = JSON.parse(content) as {
        insights?: Array<{
          type?: string;
          severity?: number;
          title?: string;
          message?: string;
          metadata?: Record<string, unknown>;
          confidence?: number;
        }>;
      };

      return (parsed.insights ?? []).map((item) => {
        const type = this.normalizeType(item.type);

        return {
          id: randomUUID(),
          datasetId: dataset.id,
          type,
          severity: this.normalizeSeverity(item.severity),
          icon: this.mapIcon(type),
          title: item.title ?? "Insight",
          message: item.message ?? "Insight generado por IA",
          metadata: {
            kpi: this.asOptionalString(item.metadata?.kpi),
            dimension: this.asOptionalString(item.metadata?.dimension),
            value: this.asOptionalNumber(item.metadata?.value),
            change: this.asOptionalNumber(item.metadata?.change),
            period: this.asOptionalString(item.metadata?.period),
          },
          generatedBy: "ai-model",
          confidence: this.normalizeConfidence(item.confidence),
          generatedAt: new Date(),
        };
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private prepareDataSummary(dataset: Dataset, filters: DashboardFilters): {
    datasetName: string;
    groupA: string;
    groupB: string;
    kpis: Array<{ name: string; label: string }>;
    filters: DashboardFilters;
    sampleSize: number;
  } {
    const kpis = (dataset.schemaMapping?.kpiFields ?? []).map((kpi: KPIField) => ({
      name: kpi.columnName,
      label: kpi.label,
    }));

    return {
      datasetName: dataset.meta.name,
      groupA: dataset.sourceConfig.groupA.label,
      groupB: dataset.sourceConfig.groupB.label,
      kpis,
      filters,
      sampleSize: dataset.data.length,
    };
  }

  private buildPrompt(
    dataset: Dataset,
    summary: {
      datasetName: string;
      groupA: string;
      groupB: string;
      kpis: Array<{ name: string; label: string }>;
      filters: DashboardFilters;
      sampleSize: number;
    },
  ): string {
    return `
Analiza el dataset comparativo y genera insights.

Dataset: ${summary.datasetName}
Descripción: ${dataset.meta.description ?? "N/A"}
Grupo A: ${summary.groupA}
Grupo B: ${summary.groupB}
Muestra: ${summary.sampleSize} filas
KPIs: ${JSON.stringify(summary.kpis)}
Filtros: ${JSON.stringify(summary.filters)}

Devuelve JSON con esta forma:
{
  "insights": [
    {
      "type": "summary|warning|suggestion|trend|anomaly",
      "severity": 1,
      "title": "texto",
      "message": "texto",
      "metadata": {
        "kpi": "opcional",
        "dimension": "opcional",
        "value": 0,
        "change": 0,
        "period": "opcional"
      },
      "confidence": 0.8
    }
  ]
}
`;
  }

  private normalizeType(type: string | undefined): InsightType {
    switch (type) {
      case "summary":
      case "warning":
      case "suggestion":
      case "trend":
      case "anomaly":
        return type;
      default:
        return "summary";
    }
  }

  private normalizeSeverity(severity: number | undefined): 1 | 2 | 3 | 4 | 5 {
    const safeSeverity = Math.max(1, Math.min(5, Math.round(severity ?? 2)));
    return safeSeverity as 1 | 2 | 3 | 4 | 5;
  }

  private normalizeConfidence(confidence: number | undefined): number {
    const value = confidence ?? 0.8;
    return Math.max(0, Math.min(1, value));
  }

  private mapIcon(type: InsightType): "💡" | "⚠️" | "✨" | "📈" | "🚨" {
    switch (type) {
      case "warning":
        return "⚠️";
      case "suggestion":
        return "✨";
      case "trend":
        return "📈";
      case "anomaly":
        return "🚨";
      case "summary":
      default:
        return "💡";
    }
  }

  private asOptionalString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private asOptionalNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  }
}
