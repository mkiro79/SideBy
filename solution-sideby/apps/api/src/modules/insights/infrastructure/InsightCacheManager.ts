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

export class InsightCacheManager {
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

  private sortObjectKeys(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortObjectKeys(item));
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
