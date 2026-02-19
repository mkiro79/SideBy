import { randomUUID } from "node:crypto";
import type {
  Dataset,
  KPIField,
} from "@/modules/datasets/domain/Dataset.entity.js";
import type { InsightsGenerator } from "@/modules/insights/application/ports/InsightsGenerator.js";
import type {
  DashboardFilters,
  DatasetInsight,
  InsightType,
} from "@/modules/insights/domain/DatasetInsight.js";
import logger from "@/utils/logger.js";

interface LLMAdapterConfig {
  baseURL: string;
  model: string;
  apiKey?: string;
  timeoutMs?: number;
}

interface LLMResponse {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
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
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const summary = this.prepareDataSummary(dataset, filters);
      const prompt = this.buildPrompt(dataset, summary);
      const estimatedPromptTokens = this.estimateTokens(prompt);
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        requestHeaders.Authorization = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: "POST",
        headers: requestHeaders,
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
              content: prompt,
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

      const insights = (parsed.insights ?? []).map((item) => {
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
          generatedBy: "ai-model" as const,
          confidence: this.normalizeConfidence(item.confidence),
          generatedAt: new Date(),
        };
      });

      const completionTokens =
        data.usage?.completion_tokens ?? this.estimateTokens(content);
      const promptTokens = data.usage?.prompt_tokens ?? estimatedPromptTokens;

      logger.info(
        {
          datasetId: dataset.id,
          model: this.config.model,
          insightsCount: insights.length,
          providerBaseUrl: this.config.baseURL,
          durationMs: Date.now() - startedAt,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens:
              data.usage?.total_tokens ?? promptTokens + completionTokens,
          },
        },
        "LLM insights generated",
      );

      return insights;
    } finally {
      clearTimeout(timeout);
    }
  }

  private prepareDataSummary(
    dataset: Dataset,
    filters: DashboardFilters,
  ): {
    datasetName: string;
    groupA: string;
    groupB: string;
    kpis: Array<{ name: string; label: string }>;
    filters: DashboardFilters;
    sampleSize: number;
  } {
    const kpis = (dataset.schemaMapping?.kpiFields ?? []).map(
      (kpi: KPIField) => ({
        name: this.sanitizeText(kpi.columnName),
        label: this.sanitizeText(kpi.label),
      }),
    );

    const sanitizedFilters: DashboardFilters = {
      categorical: Object.fromEntries(
        Object.entries(filters.categorical ?? {}).map(([key, values]) => [
          this.sanitizeText(key),
          values.map((value) => this.sanitizeText(value)),
        ]),
      ),
    };

    return {
      datasetName: this.sanitizeText(dataset.meta.name),
      groupA: this.sanitizeText(dataset.sourceConfig.groupA.label),
      groupB: this.sanitizeText(dataset.sourceConfig.groupB.label),
      kpis,
      filters: sanitizedFilters,
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

  private sanitizeText(value: string): string {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
      .replace(/\b\d{8,}\b/g, "[REDACTED_NUMBER]")
      .trim();
  }

  private estimateTokens(text: string): number {
    if (!text) {
      return 0;
    }

    return Math.ceil(text.length / 4);
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
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : undefined;
  }
}
