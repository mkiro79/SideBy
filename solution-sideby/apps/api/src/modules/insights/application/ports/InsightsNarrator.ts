import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import type {
  BusinessNarrative,
  DatasetInsight,
} from "@/modules/insights/domain/DatasetInsight.js";

export interface NarrativeInput {
  dataset: Dataset;
  insights: DatasetInsight[];
  language: "es" | "en";
  userContext?: string;
}

export interface InsightsNarrator {
  generateNarrative(input: NarrativeInput): Promise<BusinessNarrative>;
}
