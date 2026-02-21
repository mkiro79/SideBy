import type { InsightsCacheRepository } from "@/modules/insights/application/ports/InsightsCacheRepository.js";
import type {
  CachedInsightsPayload,
  DashboardFilters,
  InsightCacheContext,
} from "@/modules/insights/domain/DatasetInsight.js";

/**
 * Repositorio de caché híbrido de dos niveles: memoria + persistencia.
 *
 * Implementa un patrón de caché en capas donde la búsqueda sigue el orden:
 * 1. **Caché en memoria** (L1): rápida, volátil, limitada al ciclo de vida del proceso.
 * 2. **Caché persistente** (L2): más lenta, duradera, respaldada por MongoDB con TTL.
 *
 * En caso de **cache miss en L1 y hit en L2**, el resultado se almacena en L1
 * (warm-up) para acelerar consultas subsiguientes en la misma instancia.
 *
 * En `saveToCache`, la escritura en L1 (memoria) es siempre prioritaria.
 * La escritura en L2 (persistencia) es secundaria y, en caso de fallo, se ignora
 * silenciosamente para no bloquear el flujo del caller.
 *
 * @example
 * ```typescript
 * const hybridRepo = new HybridInsightsCacheRepository(
 *   new InMemoryInsightsCacheRepository(),
 *   new MongoInsightsCacheRepository(),
 * );
 * const cached = await hybridRepo.findCached(datasetId, filters, context);
 * ```
 */
export class HybridInsightsCacheRepository implements InsightsCacheRepository {
  constructor(
    private readonly memoryCacheRepository: InsightsCacheRepository,
    private readonly persistentCacheRepository: InsightsCacheRepository,
  ) {}

  /**
   * Busca un snapshot cacheado: primero en memoria (L1) y luego en persistencia (L2).
   * Si se encuentra en L2, se realiza warm-up en L1 para acelerar lecturas futuras.
   *
   * @param datasetId - Identificador del dataset.
   * @param filters - Filtros aplicados al dashboard.
   * @param context - Contexto semántico (idioma, versión de prompt).
   * @returns El snapshot cacheado, o `null` si no existe en ninguna capa.
   */
  async findCached(
    datasetId: string,
    filters: DashboardFilters,
    context?: InsightCacheContext,
  ): Promise<CachedInsightsPayload | null> {
    const memoryPayload = await this.memoryCacheRepository.findCached(
      datasetId,
      filters,
      context,
    );

    if (memoryPayload) {
      return memoryPayload;
    }

    const persistentPayload = await this.persistentCacheRepository.findCached(
      datasetId,
      filters,
      context,
    );

    if (persistentPayload) {
      await this.memoryCacheRepository.saveToCache(
        datasetId,
        filters,
        persistentPayload,
        context,
      );
      return persistentPayload;
    }

    return null;
  }

  /**
   * Persiste un snapshot en ambas capas de caché.
   * La escritura en L1 (memoria) es garantizada; la escritura en L2 (MongoDB)
   * es de mejor esfuerzo: los fallos se ignoran silenciosamente para mantener
   * consistencia sin bloquear al caller.
   *
   * @param datasetId - Identificador del dataset.
   * @param filters - Filtros aplicados al dashboard.
   * @param payload - Snapshot completo de insights y narrativa.
   * @param context - Contexto semántico (idioma, versión de prompt).
   */
  async saveToCache(
    datasetId: string,
    filters: DashboardFilters,
    payload: CachedInsightsPayload,
    context?: InsightCacheContext,
  ): Promise<void> {
    await this.memoryCacheRepository.saveToCache(
      datasetId,
      filters,
      payload,
      context,
    );

    try {
      await this.persistentCacheRepository.saveToCache(
        datasetId,
        filters,
        payload,
        context,
      );
    } catch {
      // Nota: Ignoramos errores del caché persistente para no bloquear si Mongo falla.
    }
  }

  /**
   * Invalida las entradas de caché de un dataset en ambas capas.
   *
   * @param datasetId - Identificador del dataset cuyas entradas se deben invalidar.
   */
  async invalidate(datasetId: string): Promise<void> {
    await this.memoryCacheRepository.invalidate(datasetId);
    await this.persistentCacheRepository.invalidate(datasetId);
  }
}
