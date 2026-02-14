/**
 * Dataset Dashboard Page
 * 
 * Página principal para visualizar un dataset creado.
 * Renderiza el dashboard según el template configurado (sideby_executive).
 * 
 * Features:
 * - KPI Cards destacados (max 4)
 * - Tabla de datos comparativos
 * - Navegación de vuelta a la lista
 * - Badge de estado del dataset
 * 
 * @see {@link docs/design/prompts/FRONTEND-DATASETS-INTEGRATION.md} - RFC Implementation
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import { SidebarProvider } from '@/shared/components/ui/sidebar.js';
import { AppSidebar } from '@/shared/components/AppSidebar.js';
import { Button } from '@/shared/components/ui/button.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { Separator } from '@/shared/components/ui/Separator.js';
import { useDataset } from '../hooks/useDataset.js';
import { KPICard } from '../components/KPICard.js';
import { DatasetTable } from '../components/DatasetTable.js';
import type { DataRow } from '../types/api.types.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula el valor total de un KPI para un grupo específico
 */
function calculateKPIValue(
  data: DataRow[],
  kpiColumnName: string,
  group: 'groupA' | 'groupB'
): number {
  const groupData = data.filter((row) => row._source_group === group);
  
  const total = groupData.reduce((sum, row) => {
    const value = row[kpiColumnName];
    const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return sum + (Number.isNaN(numValue) ? 0 : numValue);
  }, 0);
  
  return total;
}

/**
 * Calcula el cambio porcentual entre dos valores
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Formatea un valor según el formato del KPI
 */
function formatKPIValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'number':
      return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    
    default:
      return String(value);
  }
}

/**
 * Mapea un KPI a un ícono Lucide (simple mapping)
 */
function getKPIIcon(kpiId: string) {
  // Mapeo simple basado en palabras clave
  const lowerKpiId = kpiId.toLowerCase();
  
  if (lowerKpiId.includes('revenue') || lowerKpiId.includes('ingreso')) {
    return DollarSign;
  }
  if (lowerKpiId.includes('user') || lowerKpiId.includes('usuario')) {
    return Users;
  }
  if (lowerKpiId.includes('growth') || lowerKpiId.includes('crecimiento')) {
    return TrendingUp;
  }
  
  return Activity; // Default
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DatasetDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dataset, isLoading, error, reload } = useDataset(id || null);

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

  const { dashboardLayout, schemaMapping, data, sourceConfig, meta } = dataset;
  
  // Status badge
  let statusVariant: "success" | "destructive" | "secondary" = "secondary";
  if (dataset.status === "ready") {
    statusVariant = "success";
  } else if (dataset.status === "error") {
    statusVariant = "destructive";
  }

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
              
              <Button variant="outline" size="sm" onClick={() => reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar
              </Button>
            </div>

            <Separator />

            {/* KPI Cards Section */}
            {dashboardLayout?.highlightedKpis && dashboardLayout.highlightedKpis.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardLayout.highlightedKpis.map((kpiId) => {
                  const kpi = schemaMapping?.kpiFields?.find((k) => k.id === kpiId);
                  if (!kpi) return null;

                  // Calcular valores
                  const currentValue = calculateKPIValue(data, kpi.columnName, 'groupA');
                  const comparativeValue = calculateKPIValue(data, kpi.columnName, 'groupB');
                  const percentageChange = calculatePercentageChange(currentValue, comparativeValue);

                  return (
                    <KPICard
                      key={kpiId}
                      title={kpi.label}
                      currentValue={formatKPIValue(currentValue, kpi.format)}
                      comparativeValue={formatKPIValue(comparativeValue, kpi.format)}
                      percentageChange={percentageChange}
                      icon={getKPIIcon(kpiId)}
                      groupALabel={sourceConfig.groupA.label}
                      groupBLabel={sourceConfig.groupB.label}
                    />
                  );
                })}
              </div>
            )}

            {/* Data Table */}
            <DatasetTable dataset={dataset} maxRows={50} />

            {/* Footer Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <strong>Total de filas:</strong> {data.length}
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
