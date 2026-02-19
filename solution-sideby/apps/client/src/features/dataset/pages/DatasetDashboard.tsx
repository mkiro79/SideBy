/**
 * Dataset Dashboard Page
 * 
 * Página principal para visualizar un dataset creado.
 * Sistema de templates con 3 vistas: Executive, Trends, Detailed.
 * 
 * Features:
 * - Selector de templates (Executive, Trends, Detailed)
 * - Filtros categóricos dinámicos
 * - KPI Grid con cálculos automáticos
 * - Gráfico de comparación horizontal
 * - Tabla de datos comparativos con expansión
 * 
 * @see {@link docs/design/RFC-004-DASHBOARD-TEMPLATES.md} - Phase 7 Implementation
 */

import { useState } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { SidebarProvider } from '@/shared/components/ui/sidebar.js';
import { AppSidebar } from '@/shared/components/AppSidebar.js';
import { Button } from '@/shared/components/ui/button.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { Separator } from '@/shared/components/ui/Separator.js';
import { useDatasetDashboard } from '../hooks/useDatasetDashboard.js';
import { calculateDelta } from '@/features/dataset/utils/delta.js';
import { TemplateSelector } from '../components/dashboard/TemplateSelector.js';
import { DashboardFiltersBar } from '../components/dashboard/DashboardFiltersBar.js';
import { KPIGrid } from '../components/dashboard/KPIGrid.js';
import { TrendChart } from '../components/dashboard/TrendChart.js';
import { AIInsights } from '../components/dashboard/AIInsights.js';
import { TrendsGrid } from '../components/dashboard/TrendsGrid.js';
import { DimensionGrid } from '../components/dashboard/DimensionGrid.js';
import { SummaryTable } from '../components/dashboard/SummaryTable.js';
import { GranularTable } from '../components/dashboard/GranularTable.js';
import { CategoryChart } from '../components/dashboard/CategoryChart.js';
import type { DashboardTemplateId, DashboardFilters, KPIResult } from '../types/dashboard.types.js';
import type { DataRow } from '../types/api.types.js';


// ============================================================================
// COMPONENT
// ============================================================================

export default function DatasetDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State para template y filtros
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplateId>('sideby_executive');
  const [filters, setFilters] = useState<DashboardFilters>({ categorical: {} });

  // Hook principal del dashboard
  const { dataset, kpis, filteredData, categoricalFields, isLoading, error } = useDatasetDashboard({
    datasetId: id || null,
    templateId: selectedTemplate,
    filters,
  });
  
  // State para granularidad temporal (usado en filtro de período)
  const [granularity, setGranularity] = useState<'days' | 'weeks' | 'months' | 'quarters'>('months');

  // Handler para cambio de granularidad - limpia el filtro de período automáticamente
  const handleGranularityChange = (newGranularity: 'days' | 'weeks' | 'months' | 'quarters') => {
    setGranularity(newGranularity);
    // Limpiar filtro de período cuando cambia granularidad para evitar valores inconsistentes
    setFilters((prev) => ({
      ...prev,
      periodFilter: undefined,
    }));
  };

  // Handler para cambio de filtros multi-select (RFC-005)
  const handleFilterChange = (field: string, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      categorical: {
        ...prev.categorical,
        [field]: values,
      },
    }));
  };

  // Handler para cambio de filtro de período
  const handlePeriodFilterChange = (periodFilter?: { from?: number; to?: number }) => {
    setFilters((prev) => ({
      ...prev,
      periodFilter,
    }));
  };

  // Handler para limpiar todos los filtros (RFC-005)
  const handleClearFilters = () => {
    setFilters({ categorical: {}, periodFilter: undefined });
  };

  // Helper: Aplicar filtro de período a los datos filtrados
  const dataWithPeriodFilter = React.useMemo(() => {
    // Si no hay filtro de período, retornar datos sin cambios
    if (!filters.periodFilter?.from && !filters.periodFilter?.to) {
      return filteredData;
    }

    // Si no hay campo de fecha, no podemos aplicar filtro temporal
    const dateField = dataset?.schemaMapping?.dateField;
    if (!dateField || !filteredData.length) {
      return filteredData;
    }

    // Filtrar datos basados en el período seleccionado
    // El filtro de período trabaja con índices (1-12 para meses, 1-52 para semanas, etc.)
    return filteredData.filter((row) => {
      const dateValue = row[dateField];
      if (!dateValue) return false;

      const date = new Date(dateValue as string);
      if (isNaN(date.getTime())) return false;

      // Calcular el índice según la granularidad (usando UTC para consistencia)
      let periodIndex: number;
      switch (granularity) {
        case 'days': {
          // Día del año (1-365), usando UTC para evitar problemas de zona horaria
          const utcYear = date.getUTCFullYear();
          const startOfYear = Date.UTC(utcYear, 0, 1);
          const diff = date.getTime() - startOfYear;
          const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
          // Limitar a 365 para alinearse con getPeriodConfig (años bisiestos podrían dar 366)
          periodIndex = Math.min(dayOfYear, 365);
          break;
        }
        case 'weeks': {
          // Semana del año (1-52), usando UTC para evitar problemas de zona horaria
          const utcYear = date.getUTCFullYear();
          const firstDay = Date.UTC(utcYear, 0, 1);
          const daysDiff = Math.floor((date.getTime() - firstDay) / (1000 * 60 * 60 * 24));
          const weekOfYear = Math.floor(daysDiff / 7) + 1;
          // Limitar a 52 para alinearse con getPeriodConfig (algunos años pueden tener 53 semanas)
          periodIndex = Math.min(weekOfYear, 52);
          break;
        }
        case 'months':
          // Mes (1-12), usando UTC
          periodIndex = date.getUTCMonth() + 1;
          break;
        case 'quarters':
          // Trimestre (1-4), usando UTC
          periodIndex = Math.floor(date.getUTCMonth() / 3) + 1;
          break;
        default:
          return true;
      }

      // Verificar si el índice está dentro del rango
      const from = filters.periodFilter?.from;
      const to = filters.periodFilter?.to;
      if (from !== undefined && periodIndex < from) return false;
      if (to !== undefined && periodIndex > to) return false;
      return true;
    });
  }, [filteredData, filters.periodFilter, granularity, dataset?.schemaMapping?.dateField]);

  const kpisWithPeriodFilter = React.useMemo<KPIResult[]>(() => {
    if (kpis.length === 0) {
      return [];
    }

    const dataA = dataWithPeriodFilter.filter((row) => row._source_group === 'groupA');
    const dataB = dataWithPeriodFilter.filter((row) => row._source_group === 'groupB');

    return kpis.map((kpi) => {
      const valueA = calculateAggregate(dataA, kpi.name);
      const valueB = calculateAggregate(dataB, kpi.name);
      const { deltaAbs, deltaPercent, trend } = calculateDelta(valueA, valueB);

      return {
        ...kpi,
        valueA,
        valueB,
        diff: deltaAbs,
        diffPercent: deltaPercent,
        trend,
      };
    });
  }, [kpis, dataWithPeriodFilter]);

  // Helper: Mapea de API KPI fields a formato wizard KPIField
  const mappedKpiFields = dataset?.schemaMapping?.kpiFields.map(kpi => ({
    id: kpi.id,
    sourceColumn: kpi.columnName,
    label: kpi.label,
    type: kpi.format as 'number' | 'currency' | 'percentage',
    aggregation: 'sum' as const,
    format: kpi.format as 'number' | 'currency' | 'percentage',
  })) ?? [];

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Cargando dataset...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto py-8 px-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/datasets')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-destructive">Error</h1>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // ============================================================================
  // NO DATASET
  // ============================================================================

  if (!dataset) {
    return null;
  }

  // ============================================================================
  // RENDER DASHBOARD
  // ============================================================================
  
  // Status badge variant
  let statusVariant: "success" | "destructive" | "secondary" = "secondary";
  if (dataset.status === "ready") {
    statusVariant = "success";
  } else if (dataset.status === "error") {
    statusVariant = "destructive";
  }

  const { meta, sourceConfig, schemaMapping } = dataset;
  
  // Labels de grupo
  const groupALabel = sourceConfig.groupA.label;
  const groupBLabel = sourceConfig.groupB.label;
  const groupAColor = sourceConfig.groupA.color || 'hsl(var(--primary))';
  const groupBColor = sourceConfig.groupB.color || 'hsl(var(--secondary))';
  
  // Date field para gráficos temporales
  const dateField = schemaMapping?.dateField;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto py-8 px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/datasets')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{meta.name}</h1>
                    <Badge variant={statusVariant}>{dataset.status}</Badge>
                  </div>
                  {meta.description && (
                    <p className="text-muted-foreground mt-1">{meta.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* TODO: RFC-007 - Export PDF Button */}
                {/* <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button> */}
                
                {/* Reload Button */}
                <Button variant="outline" size="sm" onClick={() => globalThis.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Template Selector - Nueva sección con label */}
            <div className="flex items-center gap-3">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>

            {/* Filters Bar */}
            <DashboardFiltersBar
              categoricalFields={categoricalFields}
              filters={filters.categorical}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              dataset={dataset}
              periodFilter={filters.periodFilter}
              onPeriodFilterChange={handlePeriodFilterChange}
              granularity={granularity}
            />

            {/* KPI Grid */}
            <KPIGrid kpis={kpisWithPeriodFilter} />

            {/* RFC-006 Trends View: Grid 2×2 de mini-charts temporales */}
            {selectedTemplate === 'sideby_trends' && dateField && dataWithPeriodFilter.length > 0 && (
              <TrendsGrid
                kpis={kpisWithPeriodFilter}
                data={dataWithPeriodFilter}
                dateField={dateField}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
                granularity={granularity}
                onGranularityChange={handleGranularityChange}
              />
            )}

            {/* RFC-006 Trends View: Grid 2×2 de mini-charts por dimensión */}
            {selectedTemplate === 'sideby_trends' && categoricalFields.length > 0 && (
              <DimensionGrid
                kpis={kpisWithPeriodFilter}
                data={dataWithPeriodFilter}
                dimensions={categoricalFields}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            )}

            {/* RFC-006 CategoryChart - Análisis por dimensión categórica (Solo Executive) */}
            {selectedTemplate === 'sideby_executive' && categoricalFields.length > 0 && (
              <CategoryChart
                data={dataWithPeriodFilter}
                kpis={kpisWithPeriodFilter}
                dimensions={categoricalFields}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            )}

            {/* Trend Chart - Solo si hay dateField y datos (no en Detailed ni Trends)*/}
            {dateField && kpisWithPeriodFilter.length > 0 && dataWithPeriodFilter.length > 0 && selectedTemplate !== 'sideby_detailed' && selectedTemplate !== 'sideby_trends' && (
              <TrendChart
                data={dataWithPeriodFilter}
                dateField={dateField}
                kpis={kpisWithPeriodFilter}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            )}

            {/* RFC-006 Detailed View: SummaryTable + GranularTable */}
            {selectedTemplate === 'sideby_detailed' ? (
              <div className="space-y-6">
                <SummaryTable
                  kpis={kpisWithPeriodFilter}
                  groupALabel={groupALabel}
                  groupBLabel={groupBLabel}
                  groupAColor={groupAColor}
                  groupBColor={groupBColor}
                />
                
                <GranularTable
                  data={dataWithPeriodFilter}
                  dimensions={categoricalFields}
                  kpis={mappedKpiFields}
                  groupALabel={groupALabel}
                  groupBLabel={groupBLabel}
                  groupAColor={groupAColor}
                  groupBColor={groupBColor}
                />
              </div>
            ) : (
              /* Summary Table - Tabla de totales en Executive y Trends */
              <SummaryTable
                kpis={kpisWithPeriodFilter}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            )}

            {/* AI Insights - Solo si está habilitado */}
            {dataset.aiConfig?.enabled && (
              <AIInsights
                enabled={dataset.aiConfig.enabled}
                userContext={dataset.aiConfig.userContext}
                lastAnalysis={dataset.aiConfig.lastAnalysis}
              />
            )}

            {/* Footer Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <strong>Total de filas:</strong> {dataset.data.length}
              </span>
              <span>•</span>
              <span>
                <strong>Filas filtradas:</strong> {dataWithPeriodFilter.length}
              </span>
              <span>•</span>
              <span>
                <strong>Creado:</strong> {new Date(meta.createdAt).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function calculateAggregate(data: DataRow[], field: string): number {
  if (data.length === 0) return 0;

  const values = data.map((row) => Number(row[field])).filter((v) => !Number.isNaN(v));

  if (values.length === 0) return 0;

  return values.reduce((acc, v) => acc + v, 0);
}
