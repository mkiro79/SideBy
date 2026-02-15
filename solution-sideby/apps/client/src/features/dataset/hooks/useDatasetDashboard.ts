/**
 * useDatasetDashboard - Hook para gestión del dashboard con templates
 *
 * Features:
 * - Carga dataset con React Query
 * - Calcula KPIs según template seleccionado
 * - Aplica filtros categóricos
 * - Detecta campos numéricos para KPIs
 * - Calcula diferencias y porcentajes
 */

import { useMemo } from "react";
import { useDataset } from "./useDataset.js";
import type {
  DashboardTemplateId,
  DashboardFilters,
  KPIResult,
} from "../types/dashboard.types.js";
import { DASHBOARD_TEMPLATES } from "../types/dashboard.types.js";
import type { Dataset, DataRow } from "../types/api.types.js";

interface UseDatasetDashboardParams {
  /** ID del dataset */
  datasetId: string | null;

  /** Template seleccionado */
  templateId: DashboardTemplateId;

  /** Filtros aplicados */
  filters: DashboardFilters;
}

interface UseDatasetDashboardResult {
  /** Dataset completo */
  dataset: Dataset | null;

  /** Array de KPIs calculados */
  kpis: KPIResult[];

  /** Array de datos filtrados (para gráficos/tabla) */
  filteredData: DataRow[];

  /** Campos categóricos disponibles para filtrar */
  categoricalFields: string[];

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: string | null;
}

export const useDatasetDashboard = ({
  datasetId,
  templateId,
  filters,
}: UseDatasetDashboardParams): UseDatasetDashboardResult => {
  // Cargar dataset
  const { dataset, isLoading, error } = useDataset(datasetId);

  /**
   * Datos filtrados según filtros categóricos
   */
  const filteredData = useMemo(() => {
    if (!dataset || !dataset.data) return [];

    let data = [...dataset.data];

    // Aplicar filtros categóricos
    Object.entries(filters.categorical).forEach(([field, value]) => {
      if (value && value !== "all") {
        data = data.filter((row) => row[field] === value);
      }
    });

    return data;
  }, [dataset, filters.categorical]);

  /**
   * Detectar campos categóricos (para filtros)
   * Prioridad: 1) MongoDB schemaMapping.categoricalFields, 2) Detección automática
   */
  const categoricalFields = useMemo(() => {
    // Usar campos guardados en MongoDB si existen
    if (
      dataset?.schemaMapping?.categoricalFields &&
      dataset.schemaMapping.categoricalFields.length > 0
    ) {
      return dataset.schemaMapping.categoricalFields;
    }

    // Fallback: detección automática
    if (!dataset || !dataset.data || dataset.data.length === 0) return [];

    const firstRow = dataset.data[0];
    return Object.keys(firstRow).filter((key) => {
      const value = firstRow[key];
      // Filtrar campos especiales y solo mantener strings
      return typeof value === "string" && key !== "_source_group";
    });
  }, [dataset]);

  /**
   * Calcular KPIs según template
   * Prioridad: 1) MongoDB dashboardLayout.highlightedKpis, 2) Template predefinido
   */
  const kpis = useMemo((): KPIResult[] => {
    if (!dataset || !dataset.schemaMapping) return [];

    const template = DASHBOARD_TEMPLATES[templateId];
    const kpiFields = dataset.schemaMapping.kpiFields || [];

    // Determinar qué KPIs mostrar
    let fieldsToShow = kpiFields;

    // PRIORIDAD 1: Usar highlightedKpis de MongoDB si existen
    if (
      dataset.dashboardLayout?.highlightedKpis &&
      dataset.dashboardLayout.highlightedKpis.length > 0
    ) {
      fieldsToShow = kpiFields.filter((field) =>
        dataset.dashboardLayout!.highlightedKpis.includes(field.columnName),
      );
    }
    // PRIORIDAD 2: Usar template.kpis si está definido
    else if (template.kpis.length > 0) {
      fieldsToShow = kpiFields.filter((field) =>
        template.kpis.includes(field.columnName),
      );
    }
    // FALLBACK: Mostrar todos los KPIs disponibles

    // Calcular cada KPI
    return fieldsToShow.map((field) => {
      const { columnName, label, format } = field;

      // Separar datos por grupo
      const dataA = filteredData.filter(
        (row) => row._source_group === "groupA",
      );
      const dataB = filteredData.filter(
        (row) => row._source_group === "groupB",
      );

      // Calcular suma/promedio (depende del KPI)
      const valueA = calculateAggregate(dataA, columnName);
      const valueB = calculateAggregate(dataB, columnName);

      // Diferencia
      const diff = valueA - valueB;
      const diffPercent = valueB !== 0 ? (diff / valueB) * 100 : Infinity;

      // Tendencia (asumiendo que positivo es mejor por defecto)
      const trend: "up" | "down" | "neutral" =
        !isFinite(diffPercent) || Math.abs(diffPercent) < 1 ? "neutral" : diffPercent > 0 ? "up" : "down";

      return {
        name: columnName,
        label: label || columnName,
        valueA,
        valueB,
        diff,
        diffPercent,
        format: format || "number",
        trend,
      };
    });
  }, [dataset, templateId, filteredData]);

  return {
    dataset,
    kpis,
    filteredData,
    categoricalFields,
    isLoading,
    error,
  };
};

/**
 * Calcula agregado (suma) de un campo numérico
 */
function calculateAggregate(data: DataRow[], field: string): number {
  if (data.length === 0) return 0;

  const values = data.map((row) => Number(row[field])).filter((v) => !isNaN(v));

  if (values.length === 0) return 0;

  // Suma total
  const sum = values.reduce((acc, v) => acc + v, 0);

  return sum;
}
