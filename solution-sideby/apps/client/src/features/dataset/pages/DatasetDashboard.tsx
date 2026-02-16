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
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { SidebarProvider } from '@/shared/components/ui/sidebar.js';
import { AppSidebar } from '@/shared/components/AppSidebar.js';
import { Button } from '@/shared/components/ui/button.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { Separator } from '@/shared/components/ui/Separator.js';
import { useDatasetDashboard } from '../hooks/useDatasetDashboard.js';
import { TemplateSelector } from '../components/dashboard/TemplateSelector.js';
import { DashboardFiltersBar } from '../components/dashboard/DashboardFiltersBar.js';
import { KPIGrid } from '../components/dashboard/KPIGrid.js';
import { TrendChart } from '../components/dashboard/TrendChart.js';
import { AIInsights } from '../components/dashboard/AIInsights.js';
import { TrendsGrid } from '../components/dashboard/TrendsGrid.js';
import { SummaryTable } from '../components/dashboard/SummaryTable.js';
import { GranularTable } from '../components/dashboard/GranularTable.js';
import { CategoryChart } from '../components/dashboard/CategoryChart.js';
import type { DashboardTemplateId, DashboardFilters } from '../types/dashboard.types.js';


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

  // Handler para limpiar todos los filtros (RFC-005)
  const handleClearFilters = () => {
    setFilters({ categorical: {} });
  };

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
                {/* Template Selector */}
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                />
                
                {/* Reload Button */}
                <Button variant="outline" size="sm" onClick={() => globalThis.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Filters Bar */}
            {categoricalFields.length > 0 && (
              <DashboardFiltersBar
                categoricalFields={categoricalFields}
                filters={filters.categorical}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                dataset={dataset}
              />
            )}

            {/* KPI Grid */}
            <KPIGrid
              kpis={kpis}
              groupALabel={groupALabel}
              groupBLabel={groupBLabel}
              data={filteredData}
              dateField={dateField || ''}
              groupField="_source_group"
              groupAValue="groupA"
              groupBValue="groupB"
            />

            {/* RFC-006 Trends View: Grid 2×2 de mini-charts temporales */}
            {selectedTemplate === 'sideby_trends' && dateField && filteredData.length > 0 && (
              <TrendsGrid
                kpis={kpis}
                data={filteredData}
                dateField={dateField}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            )}

            {/* Trend Chart - Solo si hay dateField y datos*/}
            {dateField && kpis.length > 0 && filteredData.length > 0 && selectedTemplate !== 'sideby_detailed' && selectedTemplate !== 'sideby_trends' && (
              <TrendChart
                data={filteredData}
                dateField={dateField}
                kpis={kpis}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            )}

            {/* RFC-006 CategoryChart - Análisis por dimensión categórica (Solo Executive) */}
            {selectedTemplate === 'sideby_executive' && categoricalFields.length > 0 && (
              <CategoryChart
                data={filteredData}
                kpis={kpis}
                dimensions={categoricalFields}
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
                  kpis={kpis}
                  groupALabel={groupALabel}
                  groupBLabel={groupBLabel}
                />
                
                <GranularTable
                  data={filteredData}
                  dimensions={categoricalFields}
                  kpis={mappedKpiFields}
                  groupALabel={groupALabel}
                  groupBLabel={groupBLabel}
                />
              </div>
            ) : (
              /* Summary Table - Tabla de totales en Executive y Trends */
              <SummaryTable
                kpis={kpis}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
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
                <strong>Filas filtradas:</strong> {filteredData.length}
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
