import type { NextFunction, Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "@/middleware/auth.middleware.js";
import { MongoDatasetRepository } from "@/modules/datasets/infrastructure/mongoose/MongoDatasetRepository.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import {
  GenerateInsightsUseCase,
  type GenerateInsightsCommand,
} from "@/modules/insights/application/use-cases/GenerateInsightsUseCase.js";
import { InMemoryInsightsCacheRepository } from "@/modules/insights/infrastructure/InMemoryInsightsCacheRepository.js";
import { RuleEngineAdapter } from "@/modules/insights/infrastructure/RuleEngineAdapter.js";
import { LLMAdapter } from "@/modules/insights/infrastructure/LLMAdapter.js";
import type { DashboardFilters } from "@/modules/insights/domain/DatasetInsight.js";

interface InsightsUseCase {
  execute(command: GenerateInsightsCommand): Promise<{
    insights: unknown[];
    fromCache: boolean;
  }>;
}

const defaultCacheRepository = new InMemoryInsightsCacheRepository(300);

export class InsightsController {
  private readonly generateInsightsUseCase: InsightsUseCase;

  constructor(generateInsightsUseCase?: InsightsUseCase) {
    if (generateInsightsUseCase) {
      this.generateInsightsUseCase = generateInsightsUseCase;
      return;
    }

    const llmEnabled = process.env.INSIGHTS_LLM_ENABLED === "true";
    const llmBaseUrl =
      process.env.INSIGHTS_LLM_BASE_URL ?? "http://localhost:11434/v1";
    const llmModel = process.env.INSIGHTS_LLM_MODEL ?? "qwen2.5:7b-instruct";
    const llmApiKey = process.env.INSIGHTS_LLM_API_KEY ?? "ollama";

    this.generateInsightsUseCase = new GenerateInsightsUseCase(
      new MongoDatasetRepository(),
      defaultCacheRepository,
      new RuleEngineAdapter(),
      new LLMAdapter({
        baseURL: llmBaseUrl,
        model: llmModel,
        apiKey: llmApiKey,
      }),
      llmEnabled,
    );
  }

  async getDatasetInsights(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: {
            message: "No autorizado",
            code: "UNAUTHORIZED",
          },
        });
        return;
      }

      const rawDatasetId = req.params.id;
      const datasetId =
        typeof rawDatasetId === "string" ? rawDatasetId : rawDatasetId?.[0];

      if (!datasetId || !mongoose.Types.ObjectId.isValid(datasetId)) {
        res.status(400).json({
          success: false,
          error: {
            message: "Dataset ID inválido",
            code: "VALIDATION_ERROR",
          },
        });
        return;
      }

      const filters = this.parseFilters(req.query.filters);
      const forceRefresh = req.query.forceRefresh === "true";

      const startTime = Date.now();
      const result = await this.generateInsightsUseCase.execute({
        datasetId,
        userId: req.userId,
        filters,
        forceRefresh,
      });
      const generationTimeMs = Date.now() - startTime;

      res.status(200).json({
        insights: result.insights,
        meta: {
          total: result.insights.length,
          generatedAt: new Date().toISOString(),
          cacheStatus: result.fromCache ? "hit" : "miss",
          generationTimeMs,
        },
      });
    } catch (error) {
      if (error instanceof DatasetNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: error.message,
            code: "NOT_FOUND",
          },
        });
        return;
      }

      next(error);
    }
  }

  private parseFilters(rawFilters: unknown): DashboardFilters {
    if (!rawFilters) {
      return { categorical: {} };
    }

    if (typeof rawFilters !== "string") {
      return { categorical: {} };
    }

    const parsed = JSON.parse(rawFilters) as DashboardFilters;

    return {
      categorical: parsed.categorical ?? {},
    };
  }
}
