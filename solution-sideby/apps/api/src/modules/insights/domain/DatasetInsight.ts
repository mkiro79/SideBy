export type InsightType =
  | "summary"
  | "warning"
  | "suggestion"
  | "trend"
  | "anomaly";

export type InsightIcon = "💡" | "⚠️" | "✨" | "📈" | "📉" | "🚨" | "✅";

export interface InsightMetadata {
  kpi?: string;
  dimension?: string;
  value?: number;
  change?: number;
  period?: string;
}

export interface DatasetInsight {
  id: string;
  datasetId: string;
  type: InsightType;
  severity: 1 | 2 | 3 | 4 | 5;
  icon: InsightIcon;
  title: string;
  message: string;
  metadata: InsightMetadata;
  generatedBy: "rule-engine" | "ai-model";
  confidence: number;
  generatedAt: Date;
  cacheTTL?: number;
}

export interface DashboardFilters {
  categorical?: Record<string, string[]>;
}
