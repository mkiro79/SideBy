import mongoose, { Schema, type Document } from "mongoose";
import type {
  CachedInsightsPayload,
  DashboardFilters,
} from "@/modules/insights/domain/DatasetInsight.js";

const defaultTtlSeconds = 86400;

function resolveCacheTtlSeconds(): number {
  const rawTtl = process.env.INSIGHTS_SUMMARY_CACHE_TTL_SECONDS;
  const parsedTtl = Number(rawTtl);

  if (Number.isFinite(parsedTtl) && parsedTtl > 0) {
    return Math.floor(parsedTtl);
  }

  return defaultTtlSeconds;
}

export interface InsightCacheDocument extends Document {
  cacheKey: string;
  datasetId: mongoose.Types.ObjectId;
  filters?: DashboardFilters;
  summary: CachedInsightsPayload;
  language: "es" | "en";
  promptVersion: string;
  createdAt: Date;
}

const InsightCacheSchema = new Schema<InsightCacheDocument>(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    datasetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    filters: {
      type: Schema.Types.Mixed,
      required: false,
    },
    summary: {
      type: Schema.Types.Mixed,
      required: true,
    },
    language: {
      type: String,
      enum: ["es", "en"],
      required: true,
      default: "es",
    },
    promptVersion: {
      type: String,
      required: true,
      default: "v1",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "insight_cache",
    versionKey: false,
  },
);

InsightCacheSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: resolveCacheTtlSeconds() },
);

export const InsightCacheModel = mongoose.model<InsightCacheDocument>(
  "InsightCache",
  InsightCacheSchema,
);
