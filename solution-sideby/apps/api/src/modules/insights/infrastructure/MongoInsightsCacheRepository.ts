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

/**
 * Repositorio de caché de insights respaldado por MongoDB.
 *
 * Implementa la interfaz {@link InsightsCacheRepository} persistiendo snapshots
 * de insights y narrativa en la colección `insight_cache`. Usa upsert para
 * garantizar idempotencia y un índice TTL para expiración automática.
 *
 * Responsabilidades:
 * - Generar y resolver claves de caché deterministas mediante {@link InsightCacheManager}.
 * - Buscar entradas existentes en MongoDB.
 * - Persistir nuevos snapshots con upsert.
 * - Invalidar (eliminar) todas las entradas de un dataset específico.
 *
 * @example
 * ```typescript
 * const repo = new MongoInsightsCacheRepository();
 * const cached = await repo.findCached(datasetId, filters, context);
 * if (!cached) {
 *   await repo.saveToCache(datasetId, filters, payload, context);
 * }
 * ```
 */
export class MongoInsightsCacheRepository implements InsightsCacheRepository {
  constructor(
    private readonly cacheManager = new InsightCacheManager(),
    private readonly cacheModel: InsightCacheModelLike = InsightCacheModel,
  ) {}

  /**
   * Busca un snapshot de insights cacheado en MongoDB para los parámetros dados.
   *
   * @param datasetId - Identificador del dataset.
   * @param filters - Filtros aplicados al dashboard.
   * @param context - Contexto semántico (idioma, versión de prompt).
   * @returns El snapshot cacheado, o `null` si no existe.
   */
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

  /**
   * Persiste un snapshot de insights en MongoDB usando upsert.
   * Si el `datasetId` no es un ObjectId válido de Mongoose, el método
   * finaliza sin error para no interrumpir el flujo del caller.
   *
   * @param datasetId - Identificador del dataset (debe ser un ObjectId válido).
   * @param filters - Filtros aplicados al dashboard.
   * @param payload - Snapshot completo de insights y narrativa a persistir.
   * @param context - Contexto semántico (idioma, versión de prompt).
   */
  async saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    payload: CachedInsightsPayload,
    context?: InsightCacheContext,
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(datasetId)) {
      return;
    }

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

  /**
   * Elimina todas las entradas de caché asociadas a un dataset específico.
   * Si el `datasetId` no es un ObjectId válido, el método finaliza sin error.
   *
   * @param datasetId - Identificador del dataset cuyas entradas se deben invalidar.
   */
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
