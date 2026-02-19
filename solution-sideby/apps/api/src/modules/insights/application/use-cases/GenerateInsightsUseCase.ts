import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";
import type { InsightsGenerator } from "@/modules/insights/application/ports/InsightsGenerator.js";
import type {
  DashboardFilters,
  DatasetInsight,
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
  fromCache: boolean;
}

export class GenerateInsightsUseCase {
  constructor(
    private readonly datasetRepository: DatasetRepository,
    private readonly insightRepository: InsightsCacheRepository,
    private readonly ruleEngineAdapter: InsightsGenerator,
    private readonly llmAdapter: InsightsGenerator | null,
    private readonly llmEnabled: boolean,
  ) {}

  async execute(
    command: GenerateInsightsCommand,
  ): Promise<GenerateInsightsResult> {
    const { datasetId, userId, filters, forceRefresh } = command;

    const dataset = await this.datasetRepository.findById(datasetId);

    if (!dataset || dataset.ownerId !== userId) {
      throw new DatasetNotFoundError(datasetId);
    }

    if (!forceRefresh) {
      const cached = await this.insightRepository.findCached(datasetId, filters);
      if (cached) {
        return { insights: cached, fromCache: true };
      }
    }

    let insights: DatasetInsight[];

    if (this.llmEnabled && this.shouldUseLLM(dataset) && this.llmAdapter) {
      try {
        insights = await this.llmAdapter.generateInsights(dataset, filters);
      } catch (error) {
        logger.warn({ err: error, datasetId }, "LLM generation failed, using rules fallback");
        insights = await this.ruleEngineAdapter.generateInsights(dataset, filters);
      }
    } else {
      insights = await this.ruleEngineAdapter.generateInsights(dataset, filters);
    }

    await this.insightRepository.saveToCache(datasetId, filters, insights);

    return { insights, fromCache: false };
  }

  private shouldUseLLM(dataset: { aiConfig?: { enabled?: boolean } }): boolean {
    return dataset.aiConfig?.enabled === true;
  }
}
