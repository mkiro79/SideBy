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
import { ComparisonChart } from '../components/dashboard/ComparisonChart.js';
import { ComparisonTable } from '../components/dashboard/ComparisonTable.js';
import { TrendChart } from '../components/dashboard/TrendChart.js';
import { AIInsights } from '../components/dashboard/AIInsights.js';
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
  
  // Handler para cambio de filtros
  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      categorical: {
        ...prev.categorical,
        [field]: value,
      },
    }));
  };

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
  
  // Tomar primer KPI para el gráfico de tendencias
  const firstKpi = kpis[0];

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
                dataset={dataset}
              />
            )}

            {/* KPI Grid */}
            <KPIGrid
              kpis={kpis}
              groupALabel={groupALabel}
              groupBLabel={groupBLabel}
              groupAColor={groupAColor}
              groupBColor={groupBColor}
            />

            {/* Trend Chart - Solo si hay dateField y datos*/}
            {dateField && firstKpi && filteredData.length > 0 && selectedTemplate !== 'sideby_detailed' && (
              <TrendChart
                data={filteredData}
                dateField={dateField}
                kpiField={firstKpi.name}
                kpiLabel={`Tendencia de ${firstKpi.label}`}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
                format={firstKpi.format as 'number' | 'currency' | 'percentage'}
              />
            )}

            {/* Comparison Chart - Solo en templates Executive y Trends */}
            {selectedTemplate !== 'sideby_detailed' && (
              <ComparisonChart
                kpis={kpis}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            )}

            {/* Comparison Table - Ahora recibe kpis en vez de data raw */}
            <ComparisonTable
              kpis={kpis}
              groupALabel={groupALabel}
              groupBLabel={groupBLabel}
            />

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
