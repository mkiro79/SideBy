import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import type {
  BusinessNarrative,
  DatasetInsight,
} from "@/modules/insights/domain/DatasetInsight.js";
import type {
  InsightsNarrator,
  NarrativeInput,
} from "@/modules/insights/application/ports/InsightsNarrator.js";

interface LLMNarratorConfig {
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

export class LLMNarratorAdapter implements InsightsNarrator {
  private readonly timeoutMs: number;

  /**
   * Expresión regular para extraer el nombre de país desde mensajes de insights
   * con formato "País <nombre>: ...". Se define como constante de clase para
   * evitar recompilación en cada llamada a `extractTopCountries`.
   */
  private static readonly COUNTRY_PATTERN = /País\s+([^:]+)/;

  constructor(private readonly config: LLMNarratorConfig) {
    this.timeoutMs = config.timeoutMs ?? 120000;
  }

  async generateNarrative(input: NarrativeInput): Promise<BusinessNarrative> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.2,
          max_tokens: 450,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `
Eres un Analista de Datos Senior para directiva C-Level.
Responde con síntesis ejecutiva accionable, sin introducciones ni relleno.
No repitas números sin interpretación de impacto.
Agrupa anomalías relacionadas en conclusiones únicas.
Devuelve exclusivamente JSON válido.
`,
            },
            {
              role: "user",
              content: this.buildPrompt(input.dataset, input.insights, input),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `LLM narrator request failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as LLMResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty LLM narrator response");
      }

      const parsed = JSON.parse(content) as {
        summary?: unknown;
        recommendedActions?: unknown;
        confidence?: unknown;
        language?: unknown;
      };

      return {
        summary:
          typeof parsed.summary === "string"
            ? parsed.summary
            : "No se pudo generar narrativa en este momento.",
        recommendedActions: Array.isArray(parsed.recommendedActions)
          ? parsed.recommendedActions
              .filter((item): item is string => typeof item === "string")
              .slice(0, 5)
          : [],
        language: parsed.language === "en" ? "en" : input.language,
        generatedBy: "ai-model",
        model: this.config.model,
        confidence:
          typeof parsed.confidence === "number" &&
          Number.isFinite(parsed.confidence)
            ? Math.min(1, Math.max(0, parsed.confidence))
            : 0.8,
        generatedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private buildPrompt(
    dataset: Dataset,
    insights: DatasetInsight[],
    input: NarrativeInput,
  ): string {
    const topCountries = this.extractTopCountries(insights);
    const weakestMetrics = this.extractWeakestMetrics(insights);

    const digest = insights.slice(0, 8).map((insight) => ({
      type: insight.type,
      severity: insight.severity,
      title: insight.title,
      message: insight.message,
      metadata: insight.metadata,
    }));

    return `
  Genera un resumen ejecutivo de alto nivel a partir de insights por reglas.

Dataset: ${dataset.meta.name}
Descripción: ${dataset.meta.description ?? "N/A"}
Idioma requerido: ${input.language}
Contexto usuario: ${this.sanitizeText(input.userContext ?? "N/A")}

Top 3 países con mejor señal (calculado):
${JSON.stringify(topCountries, null, 2)}

Top 3 métricas a mejorar (calculado):
${JSON.stringify(weakestMetrics, null, 2)}

Insights fuente (verdad):
${JSON.stringify(digest, null, 2)}

Instrucciones:
1) No inventes datos fuera de los insights fuente.
2) Cero introducciones; ve directo al hallazgo de negocio.
3) Evita redundancias y evita listar métricas sin interpretación.
4) Entrega summary en máximo 3 frases, con foco en impacto.
5) Entrega entre 3 y 5 acciones concretas, priorizadas y verificables.
6) Las acciones deben referenciar países o métricas concretas cuando existan.
7) Responde SOLO JSON con esta forma:
{
  "summary": "...",
  "recommendedActions": ["...", "..."],
  "confidence": 0.8,
  "language": "${input.language}"
}
`;
  }

  private sanitizeText(value: string): string {
    return value
      .replaceAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
      .replaceAll(/\b\d{8,}\b/g, "[REDACTED_NUMBER]")
      .trim();
  }

  private extractTopCountries(insights: DatasetInsight[]): Array<{
    country: string;
    kpi: string;
    change: number;
  }> {
    const countries = insights
      .filter(
        (insight) =>
          insight.metadata.dimension === "country" &&
          typeof insight.metadata.change === "number" &&
          insight.metadata.change > 0,
      )
      .map((insight) => {
        const countryMatch = LLMNarratorAdapter.COUNTRY_PATTERN.exec(insight.message);

        return {
          country: String(countryMatch?.[1] ?? "N/A"),
          kpi: insight.metadata.kpi ?? "unknown",
          change: insight.metadata.change ?? 0,
        };
      })
      .sort((a, b) => b.change - a.change);

    const uniqueCountries = new Map<
      string,
      { country: string; kpi: string; change: number }
    >();
    for (const item of countries) {
      if (!uniqueCountries.has(item.country)) {
        uniqueCountries.set(item.country, item);
      }
    }

    return [...uniqueCountries.values()].slice(0, 3);
  }

  private extractWeakestMetrics(insights: DatasetInsight[]): Array<{
    kpi: string;
    change: number;
  }> {
    return insights
      .filter(
        (insight) =>
          typeof insight.metadata.kpi === "string" &&
          typeof insight.metadata.change === "number" &&
          insight.metadata.change < 0,
      )
      .map((insight) => ({
        kpi: insight.metadata.kpi as string,
        change: insight.metadata.change as number,
      }))
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);
  }
}
