import mongoose from "mongoose";
import type {
  CachedInsightsPayload,
  DashboardFilters,
  InsightCacheContext,
} from "@/modules/insights/domain/DatasetInsight.js";
import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";
import { InsightCacheManager } from "@/modules/insights/infrastructure/InsightCacheManager.js";
import {
  InsightCacheModel,
  type InsightCacheDocument,
} from "@/modules/insights/infrastructure/mongoose/InsightCacheSchema.js";

interface InsightCacheModelLike {
  findOne(query: { cacheKey: string }): {
    lean(): Promise<InsightCacheDocument | null>;
  };
  updateOne(
    filter: { cacheKey: string },
    update: Record<string, unknown>,
    options: { upsert: boolean },
  ): Promise<unknown>;
  deleteMany(query: Record<string, unknown>): Promise<unknown>;
}

export class MongoInsightsCacheRepository implements InsightsCacheRepository {
  constructor(
    private readonly cacheManager = new InsightCacheManager(),
    private readonly cacheModel: InsightCacheModelLike = InsightCacheModel,
  ) {}

  async findCached(
    datasetId: string,
    filters: DashboardFilters,
    context?: InsightCacheContext,
  ): Promise<CachedInsightsPayload | null> {
    const normalizedContext = this.resolveContext(context);
    const cacheKey = this.cacheManager.generateCacheKey(datasetId, {
      filters,
      language: normalizedContext.language,
      promptVersion: normalizedContext.promptVersion,
    });

    const cached = await this.cacheModel.findOne({ cacheKey }).lean();

    if (!cached?.summary) {
      return null;
    }

    return cached.summary;
  }

  async saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    payload: CachedInsightsPayload,
    context?: InsightCacheContext,
  ): Promise<void> {
    const normalizedContext = this.resolveContext(context);
    const cacheKey = this.cacheManager.generateCacheKey(datasetId, {
      filters,
      language: normalizedContext.language,
      promptVersion: normalizedContext.promptVersion,
    });

    await this.cacheModel.updateOne(
      { cacheKey },
      {
        $set: {
          cacheKey,
          datasetId: new mongoose.Types.ObjectId(datasetId),
          filters,
          summary: payload,
          language: normalizedContext.language,
          promptVersion: normalizedContext.promptVersion,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async invalidate(datasetId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(datasetId)) {
      return;
    }

    await this.cacheModel.deleteMany({
      datasetId: new mongoose.Types.ObjectId(datasetId),
    });
  }

  private resolveContext(context?: InsightCacheContext): InsightCacheContext {
    return {
      language: context?.language ?? "es",
      promptVersion: context?.promptVersion ?? "v1",
    };
  }
}
