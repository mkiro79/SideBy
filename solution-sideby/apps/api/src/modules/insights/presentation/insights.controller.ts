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
import { LLMNarratorAdapter } from "@/modules/insights/infrastructure/LLMNarratorAdapter.js";
import type {
  BusinessNarrative,
  DashboardFilters,
  NarrativeStatus,
} from "@/modules/insights/domain/DatasetInsight.js";

interface InsightsUseCase {
  execute(command: GenerateInsightsCommand): Promise<{
    insights: unknown[];
    businessNarrative?: BusinessNarrative;
    narrativeStatus: NarrativeStatus;
    fromCache: boolean;
  }>;
}

type InsightSource = "rule-engine" | "ai-model";
type InsightsGenerationSource = InsightSource | "mixed" | "unknown";

const defaultCacheRepository = new InMemoryInsightsCacheRepository(300);

type LlmProvider = "ollama" | "openai-compatible";

export class InsightsController {
  private readonly generateInsightsUseCase: InsightsUseCase;

  constructor(generateInsightsUseCase?: InsightsUseCase) {
    if (generateInsightsUseCase) {
      this.generateInsightsUseCase = generateInsightsUseCase;
      return;
    }

    const llmEnabled = process.env.INSIGHTS_LLM_ENABLED === "true";
    const llmProvider =
      (process.env.INSIGHTS_LLM_PROVIDER as LlmProvider | undefined) ??
      "ollama";
    const defaultBaseUrl =
      llmProvider === "openai-compatible"
        ? "https://api.openai.com/v1"
        : "http://localhost:11434/v1";
    const defaultApiKey = llmProvider === "openai-compatible" ? "" : "ollama";

    const llmBaseUrl = process.env.INSIGHTS_LLM_BASE_URL ?? defaultBaseUrl;
    const llmModel = process.env.INSIGHTS_LLM_MODEL ?? "gemma2:9b";
    const llmApiKey = process.env.INSIGHTS_LLM_API_KEY ?? defaultApiKey;
    const llmTimeoutMs = Number(process.env.INSIGHTS_LLM_TIMEOUT_MS ?? 120000);

    this.generateInsightsUseCase = new GenerateInsightsUseCase(
      new MongoDatasetRepository(),
      defaultCacheRepository,
      new RuleEngineAdapter(),
      new LLMNarratorAdapter({
        baseURL: llmBaseUrl,
        model: llmModel,
        apiKey: llmApiKey,
        timeoutMs:
          Number.isFinite(llmTimeoutMs) && llmTimeoutMs > 0
            ? llmTimeoutMs
            : 120000,
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
      const generationSource = this.resolveGenerationSource(result.insights);

      res.status(200).json({
        insights: result.insights,
        businessNarrative: result.businessNarrative,
        meta: {
          total: result.insights.length,
          generatedAt: new Date().toISOString(),
          cacheStatus: result.fromCache ? "hit" : "miss",
          generationSource,
          narrativeStatus: result.narrativeStatus,
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

  private resolveGenerationSource(
    insights: unknown[],
  ): InsightsGenerationSource {
    if (insights.length === 0) {
      return "unknown";
    }

    const sources = new Set<InsightSource>();

    for (const insight of insights) {
      if (!insight || typeof insight !== "object") {
        continue;
      }

      const generatedBy = (insight as { generatedBy?: unknown }).generatedBy;

      if (generatedBy === "rule-engine" || generatedBy === "ai-model") {
        sources.add(generatedBy);
      }
    }

    if (sources.size === 0) {
      return "unknown";
    }

    if (sources.size > 1) {
      return "mixed";
    }

    return [...sources][0];
  }
}
