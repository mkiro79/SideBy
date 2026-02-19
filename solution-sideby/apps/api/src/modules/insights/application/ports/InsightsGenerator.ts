import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import type {
  DatasetInsight,
  DashboardFilters,
} from "@/modules/insights/domain/DatasetInsight.js";

export interface InsightsGenerator {
  generateInsights(
    dataset: Dataset,
    filters: DashboardFilters,
  ): Promise<DatasetInsight[]>;
}
