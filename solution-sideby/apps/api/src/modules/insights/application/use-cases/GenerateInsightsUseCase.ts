import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type { AIConfig } from "@/modules/datasets/domain/Dataset.entity.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";
import type { InsightsGenerator } from "@/modules/insights/application/ports/InsightsGenerator.js";
import type { InsightsNarrator } from "@/modules/insights/application/ports/InsightsNarrator.js";
import type {
  BusinessNarrative,
  DashboardFilters,
  DatasetInsight,
  NarrativeStatus,
} from "@/modules/insights/domain/DatasetInsight.js";
import logger from "@/utils/logger.js";

export interface GenerateInsightsCommand {
  datasetId: string;
  userId: string;
  filters: DashboardFilters;
  forceRefresh: boolean;
}

export interface GenerateInsightsResult {
  insights: DatasetInsight[];
  businessNarrative?: BusinessNarrative;
  narrativeStatus: NarrativeStatus;
  fromCache: boolean;
}

export class GenerateInsightsUseCase {
  constructor(
    private readonly datasetRepository: DatasetRepository,
    private readonly insightRepository: InsightsCacheRepository,
    private readonly ruleEngineAdapter: InsightsGenerator,
    private readonly llmNarrator: InsightsNarrator | null,
    private readonly llmEnabled: boolean,
  ) {}

  async execute(
    command: GenerateInsightsCommand,
  ): Promise<GenerateInsightsResult> {
    const { datasetId, userId, filters, forceRefresh } = command;

    const dataset = await this.datasetRepository.findById(datasetId);

    if (dataset?.ownerId !== userId) {
      throw new DatasetNotFoundError(datasetId);
    }

    if (!forceRefresh) {
      const cached = await this.insightRepository.findCached(
        datasetId,
        filters,
      );
      if (cached) {
        return {
          insights: cached.insights,
          businessNarrative: cached.businessNarrative,
          narrativeStatus: cached.narrativeStatus ?? "not-requested",
          fromCache: true,
        };
      }
    }

    const insights = await this.ruleEngineAdapter.generateInsights(
      dataset,
      filters,
    );
    let businessNarrative: BusinessNarrative | undefined;
    let narrativeStatus: NarrativeStatus = "not-requested";

    if (
      this.llmEnabled &&
      this.shouldUseLLM(dataset.aiConfig) &&
      this.llmNarrator
    ) {
      try {
        businessNarrative = await this.llmNarrator.generateNarrative({
          dataset,
          insights,
          language: this.resolveLanguage(dataset.aiConfig),
          userContext: dataset.aiConfig?.userContext,
        });
        narrativeStatus = "generated";
      } catch (error) {
        logger.warn(
          { err: error, datasetId },
          "LLM narrative generation failed, using rules-only response",
        );
        narrativeStatus = "fallback";
      }
    }

    await this.insightRepository.saveToCache(datasetId, filters, {
      insights,
      businessNarrative,
      narrativeStatus,
    });

    return { insights, businessNarrative, narrativeStatus, fromCache: false };
  }

  private shouldUseLLM(aiConfig?: AIConfig): boolean {
    return (
      aiConfig?.enabledFeatures?.insights === true || aiConfig?.enabled === true
    );
  }

  private resolveLanguage(aiConfig?: AIConfig): "es" | "en" {
    const rawContext = aiConfig?.userContext;
    if (!rawContext || typeof rawContext !== "string") {
      return "es";
    }

    try {
      const parsed = JSON.parse(rawContext) as {
        language?: string;
        lang?: string;
        locale?: string;
      };

      const candidate = parsed.language ?? parsed.lang ?? parsed.locale;
      if (
        typeof candidate === "string" &&
        candidate.toLowerCase().startsWith("en")
      ) {
        return "en";
      }
      if (
        typeof candidate === "string" &&
        candidate.toLowerCase().startsWith("es")
      ) {
        return "es";
      }

      return "es";
    } catch {
      return "es";
    }
  }
}
