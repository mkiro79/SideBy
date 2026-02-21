import { createHash } from "node:crypto";
import type {
  DashboardFilters,
  InsightCacheContext,
} from "@/modules/insights/domain/DatasetInsight.js";

interface CacheKeyInput {
  filters: DashboardFilters;
  language: InsightCacheContext["language"];
  promptVersion: string;
}

/**
 * Gestor de claves de caché semántica para insights de IA.
 *
 * Genera hashes SHA-256 deterministas a partir de los parámetros de búsqueda,
 * garantizando que la misma combinación de filtros, idioma y versión de prompt
 * siempre produzca la misma clave, independientemente del orden de las claves
 * del objeto o del orden de los valores primitivos en arrays.
 *
 * Algoritmo:
 * 1. Ordena recursivamente las claves del objeto (para normalizar el orden de propiedades).
 * 2. Ordena los elementos primitivos dentro de arrays (para normalizar el orden de valores).
 * 3. Calcula SHA-256 sobre el JSON serializado del objeto normalizado.
 *
 * @example
 * ```typescript
 * const manager = new InsightCacheManager();
 * const key = manager.generateCacheKey("datasetId123", {
 *   filters: { categorical: { country: ["MX", "CO"] } },
 *   language: "es",
 *   promptVersion: "v1",
 * });
 * // key es un hash SHA-256 hexadecimal de 64 caracteres
 * ```
 */
export class InsightCacheManager {
  /**
   * Genera una clave de caché determinista para la combinación dada de dataset, filtros,
   * idioma y versión de prompt.
   *
   * @param datasetId - Identificador del dataset (ObjectId como string).
   * @param input - Parámetros de búsqueda que definen el contexto semántico del resultado.
   * @returns Hash SHA-256 hexadecimal de 64 caracteres.
   */
  generateCacheKey(datasetId: string, input: CacheKeyInput): string {
    const sortedInput = this.sortObjectKeys(input) as Record<string, unknown>;

    const normalized = {
      datasetId,
      ...sortedInput,
    };

    return createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex");
  }

  /**
   * Normaliza recursivamente un valor para garantizar orden determinista:
   * - Objetos: ordena las claves alfabéticamente.
   * - Arrays con valores primitivos: ordena los elementos por representación JSON.
   * - Arrays con objetos: aplica normalización recursiva a cada elemento (sin reordenar).
   * - Primitivos: se devuelven sin cambios.
   *
   * @param value - Valor a normalizar.
   * @returns Valor normalizado listo para serialización determinista.
   */
  private sortObjectKeys(value: unknown): unknown {
    if (Array.isArray(value)) {
      const normalizedItems = value.map((item) => this.sortObjectKeys(item));

      const allPrimitiveLike = normalizedItems.every(
        (item) => item === null || typeof item !== "object",
      );

      if (allPrimitiveLike) {
        return [...normalizedItems].sort((left, right) =>
          JSON.stringify(left).localeCompare(JSON.stringify(right)),
        );
      }

      return normalizedItems;
    }

    if (value && typeof value === "object") {
      return Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .reduce<Record<string, unknown>>((acc, [key, nestedValue]) => {
          acc[key] = this.sortObjectKeys(nestedValue);
          return acc;
        }, {});
    }

    return value;
  }
}
