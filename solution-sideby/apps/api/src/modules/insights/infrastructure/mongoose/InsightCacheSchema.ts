import mongoose, { Schema, type Document } from "mongoose";
import type {
  CachedInsightsPayload,
  DashboardFilters,
} from "@/modules/insights/domain/DatasetInsight.js";

const defaultTtlSeconds = 86400;

/**
 * Resuelve el TTL del índice de caché a partir de la variable de entorno
 * `INSIGHTS_SUMMARY_CACHE_TTL_SECONDS`. Se evalúa una sola vez en tiempo de
 * carga del módulo, por lo que cambios en la variable de entorno tras el
 * arranque de la aplicación NO afectan el TTL del índice ya registrado en
 * MongoDB. Esta es una limitación conocida de los índices TTL de MongoDB.
 *
 * @returns Número entero de segundos para el TTL (valor por defecto: 86400 = 24 h).
 */
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

/**
 * Schema Mongoose para la colección `insight_cache`.
 *
 * Estructura de campos:
 * - `cacheKey` (String, único, indexado): Hash SHA-256 que identifica la combinación
 *   semántica de dataset + filtros + idioma + versión de prompt.
 * - `datasetId` (ObjectId, indexado): Referencia al dataset para invalidación por dataset.
 * - `filters` (Mixed, opcional): Filtros del dashboard que generaron este snapshot.
 * - `summary` (Mixed, requerido): Snapshot completo de insights y narrativa.
 * - `language` (enum "es"|"en"): Idioma del snapshot generado.
 * - `promptVersion` (String): Versión del prompt LLM usado para la generación.
 * - `createdAt` (Date): Marca de tiempo de creación; usada por el índice TTL.
 *
 * Índices:
 * - Índice único sobre `cacheKey` (búsqueda rápida y upsert idempotente).
 * - Índice sobre `datasetId` (invalidación eficiente por dataset).
 * - Índice TTL sobre `createdAt` con expiración configurable vía
 *   `INSIGHTS_SUMMARY_CACHE_TTL_SECONDS` (evaluado en tiempo de carga del módulo).
 *
 * ⚠️ Nota TTL: MongoDB no permite modificar el valor de `expireAfterSeconds`
 * de un índice TTL sin eliminarlo y recrearlo. Si se cambia la variable de
 * entorno, es necesario eliminar el índice manualmente en MongoDB y reiniciar
 * la aplicación para que el nuevo TTL tenga efecto.
 */
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
