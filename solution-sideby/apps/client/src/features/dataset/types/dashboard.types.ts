/**
 * Dashboard Types - Sistema de templates para visualización de datasets
 *
 * Define tipos para templates, filtros, KPIs y configuración del dashboard
 */

/**
 * IDs de templates disponibles
 */
export type DashboardTemplateId =
  | "sideby_executive" // Vista ejecutiva (KPIs principales)
  | "sideby_trends" // Vista de tendencias (gráficos temporales)
  | "sideby_detailed"; // Vista detallada (tabla completa)

/**
 * Metadata de un template
 */
export interface DashboardTemplate {
  id: DashboardTemplateId;
  name: string;
  description: string;
  icon: string;
  kpis: string[]; // Array de nombres de KPI a mostrar
}

/**
 * Filtros aplicables al dashboard
 */
export interface DashboardFilters {
  /** Filtros categóricos multi-select (ej: { "region": ["Norte", "Sur"], "category": ["A"] }) */
  categorical: Record<string, string[]>;

  /**
   * Filtro de período relativo (aplica a AMBOS grupos por comparabilidad)
   * Índices basados en granularidad actual:
   * - days: 1-365 (día del año)
   * - weeks: 1-52 (semana del año)
   * - months: 1-12 (mes)
   * - quarters: 1-4 (trimestre)
   */
  periodFilter?: {
    from?: number;
    to?: number;
  };

  /** @deprecated Rango de fechas absoluto (usar periodFilter en su lugar) */
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Resultado de cálculo de KPI
 */
export interface KPIResult {
  /** Nombre del KPI */
  name: string;

  /** Label amigable */
  label: string;

  /** Valor del Grupo A */
  valueA: number;

  /** Valor del Grupo B */
  valueB: number;

  /** Diferencia absoluta (A - B) */
  diff: number;

  /** Diferencia porcentual ((A - B) / B * 100) */
  diffPercent: number;

  /** Formato de display */
  format: "number" | "currency" | "percentage" | "text";

  /** Tendencia (positivo = mejora, negativo = empeora) */
  trend: "up" | "down" | "neutral";
}

/**
 * Configuración de templates predefinidos
 */
export const DASHBOARD_TEMPLATES: Record<
  DashboardTemplateId,
  DashboardTemplate
> = {
  sideby_executive: {
    id: "sideby_executive",
    name: "Vista Ejecutiva",
    description: "KPIs clave para decisiones rápidas",
    icon: "BarChart3",
    kpis: ["revenue", "profit", "customers"], // Top 3
  },
  sideby_trends: {
    id: "sideby_trends",
    name: "Análisis de Tendencias",
    description: "Visualización temporal de métricas",
    icon: "TrendingUp",
    kpis: ["revenue", "orders", "conversion_rate"], // Métricas temporales
  },
  sideby_detailed: {
    id: "sideby_detailed",
    name: "Vista Detallada",
    description: "Todos los KPIs con drill-down",
    icon: "Table",
    kpis: [], // Todos los campos numéricos
  },
};
