# 🚀 Prompt para el Agente Frontend - Phase 7: Dashboard Templates (RFC-004 - Día 6-7)

---

## 📋 Prerequisitos

✅ React Query hooks (`useDataset`)  
✅ Dataset con `data[]` array disponible  
✅ Ruta `/datasets/:id/dashboard` configurada  
✅ Templates implementados en backend (o mocked en frontend)

---

## 🎯 Objetivo de esta Fase

Implementar el dashboard con sistema de templates que incluye:

1. **Template Switcher**: Selector de plantillas (Executive, Trends, Detailed)
2. **Dynamic Filters**: Filtros categóricos basados en el dataset
3. **KPI Grid**: Indicadores clave calculados por template
4. **Comparison Charts**: Gráficos group A vs group B
5. **Comparison Table**: Tabla detallada con drill-down

**Tiempo estimado:** 8-10 horas (2 días)

---

## ✅ Task 7.1: Definir tipos de templates

### Crear archivo de tipos

**Archivo:** `solution-sideby/apps/client/src/features/dataset/types/dashboard.types.ts`

```typescript
/**
 * IDs de templates disponibles
 */
export type DashboardTemplateId =
  | 'sideby_executive'   // Vista ejecutiva (KPIs principales)
  | 'sideby_trends'      // Vista de tendencias (gráficos temporales)
  | 'sideby_detailed';   // Vista detallada (tabla completa)

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
  /** Filtros categóricos (ej: { "region": "Norte", "category": "A" }) */
  categorical: Record<string, string>;
  
  /** Rango de fechas (opcional) */
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
  format: 'number' | 'currency' | 'percentage' | 'text';
  
  /** Tendencia (positivo = mejora, negativo = empeora) */
  trend: 'up' | 'down' | 'neutral';
}

/**
 * Configuración de templates predefinidos
 */
export const DASHBOARD_TEMPLATES: Record<DashboardTemplateId, DashboardTemplate> = {
  sideby_executive: {
    id: 'sideby_executive',
    name: 'Vista Ejecutiva',
    description: 'KPIs clave para decisiones rápidas',
    icon: 'BarChart3',
    kpis: ['revenue', 'profit', 'customers'], // Top 3
  },
  sideby_trends: {
    id: 'sideby_trends',
    name: 'Análisis de Tendencias',
    description: 'Visualización temporal de métricas',
    icon: 'TrendingUp',
    kpis: ['revenue', 'orders', 'conversion_rate'], // Métricas temporales
  },
  sideby_detailed: {
    id: 'sideby_detailed',
    name: 'Vista Detallada',
    description: 'Todos los KPIs con drill-down',
    icon: 'Table',
    kpis: [], // Todos los campos numéricos
  },
};
```

---

## ✅ Task 7.2: Crear hook de dashboard

### Implementar useDatasetDashboard

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useDatasetDashboard.ts`

```typescript
import { useMemo } from 'react';
import { useDataset } from './useDataset';
import {
  DashboardTemplateId,
  DashboardFilters,
  KPIResult,
  DASHBOARD_TEMPLATES,
} from '../types/dashboard.types';
import { Dataset } from '../models/Dataset';

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
  dataset: Dataset | undefined;
  
  /** Array de KPIs calculados */
  kpis: KPIResult[];
  
  /** Array de datos filtrados (para gráficos/tabla) */
  filteredData: any[];
  
  /** Campos categóricos disponibles para filtrar */
  categoricalFields: string[];
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
}

/**
 * Hook para gestión del dashboard con templates
 * 
 * Features:
 * - Carga dataset con React Query
 * - Calcula KPIs según template seleccionado
 * - Aplica filtros categóricos
 * - Detecta campos numéricos para KPIs
 * - Calcula diferencias y porcentajes
 */
export const useDatasetDashboard = ({
  datasetId,
  templateId,
  filters,
}: UseDatasetDashboardParams): UseDatasetDashboardResult => {
  // Cargar dataset
  const { data: dataset, isLoading, error } = useDataset(datasetId);

  /**
   * Datos filtrados según filtros categóricos
   */
  const filteredData = useMemo(() => {
    if (!dataset || !dataset.data) return [];

    let data = [...dataset.data];

    // Aplicar filtros categóricos
    Object.entries(filters.categorical).forEach(([field, value]) => {
      if (value && value !== 'all') {
        data = data.filter((row) => row[field] === value);
      }
    });

    return data;
  }, [dataset, filters.categorical]);

  /**
   * Detectar campos categóricos (para filtros)
   */
  const categoricalFields = useMemo(() => {
    if (!dataset || !dataset.data || dataset.data.length === 0) return [];

    const firstRow = dataset.data[0];
    return Object.keys(firstRow).filter((key) => {
      const value = firstRow[key];
      return typeof value === 'string';
    });
  }, [dataset]);

  /**
   * Calcular KPIs según template
   */
  const kpis = useMemo((): KPIResult[] => {
    if (!dataset || !dataset.schemaMapping) return [];

    const template = DASHBOARD_TEMPLATES[templateId];
    const kpiFields = dataset.schemaMapping.kpiFields || [];

    // Determinar qué KPIs mostrar
    let fieldsToShow = kpiFields;
    if (template.kpis.length > 0) {
      // Template específico (ej: Executive = top 3)
      fieldsToShow = kpiFields.filter((field) =>
        template.kpis.includes(field.originalName)
      );
    }

    // Calcular cada KPI
    return fieldsToShow.map((field) => {
      const { originalName, label, format } = field;

      // Separar datos por grupo
      const dataA = filteredData.filter((row) => row.__group === 'A');
      const dataB = filteredData.filter((row) => row.__group === 'B');

      // Calcular suma/promedio (depende del KPI)
      const valueA = calculateAggregate(dataA, originalName);
      const valueB = calculateAggregate(dataB, originalName);

      // Diferencia
      const diff = valueA - valueB;
      const diffPercent = valueB !== 0 ? (diff / valueB) * 100 : 0;

      // Tendencia (asumiendo que mayor es mejor por defecto)
      const trend: 'up' | 'down' | 'neutral' =
        Math.abs(diffPercent) < 1
          ? 'neutral'
          : diffPercent > 0
          ? 'up'
          : 'down';

      return {
        name: originalName,
        label: label || originalName,
        valueA,
        valueB,
        diff,
        diffPercent,
        format: format || 'number',
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
 * Calcula agregado (suma o promedio) de un campo
 */
function calculateAggregate(data: any[], field: string): number {
  if (data.length === 0) return 0;

  const values = data
    .map((row) => parseFloat(row[field]))
    .filter((v) => !isNaN(v));

  if (values.length === 0) return 0;

  // Suma total
  const sum = values.reduce((acc, v) => acc + v, 0);
  
  // Retornar suma (o cambiar a promedio si prefieres)
  return sum;
}
```

---

## ✅ Task 7.3: Crear componente principal del dashboard

### DatasetDashboard page

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/DatasetDashboard.tsx`

```typescript
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

import { useDatasetDashboard } from '../hooks/useDatasetDashboard';
import { DashboardTemplateId, DashboardFilters } from '../types/dashboard.types';

import { TemplateSelector } from '../components/dashboard/TemplateSelector';
import { DashboardFiltersBar } from '../components/dashboard/DashboardFiltersBar';
import { KPIGrid } from '../components/dashboard/KPIGrid';
import { ComparisonChart } from '../components/dashboard/ComparisonChart';
import { ComparisonTable } from '../components/dashboard/ComparisonTable';

/**
 * Página de dashboard con templates
 * 
 * Features:
 * - Selector de templates (Executive, Trends, Detailed)
 * - Filtros categóricos dinámicos
 * - Grid de KPIs con comparación A vs B
 * - Gráficos de barras comparativos
 * - Tabla detallada con drill-down
 */
export const DatasetDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estado local
  const [selectedTemplate, setSelectedTemplate] =
    useState<DashboardTemplateId>('sideby_executive');
  
  const [filters, setFilters] = useState<DashboardFilters>({
    categorical: {},
  });

  // Hook de dashboard
  const {
    dataset,
    kpis,
    filteredData,
    categoricalFields,
    isLoading,
    error,
  } = useDatasetDashboard({
    datasetId: id || null,
    templateId: selectedTemplate,
    filters,
  });

  /**
   * Maneja cambio de filtro categórico
   */
  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      categorical: {
        ...prev.categorical,
        [field]: value,
      },
    }));
  };

  /**
   * Navega de regreso a la lista
   */
  const handleBack = () => {
    navigate('/datasets');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !dataset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error al cargar dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'Dataset no encontrado'}
            </p>
            <Button onClick={handleBack}>Volver a la lista</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="container max-w-7xl py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold">{dataset.meta.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {dataset.meta.description || 'Dashboard comparativo'}
                  </p>
                </div>
              </div>

              {/* Template Selector */}
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
              dataset={dataset}
            />

            {/* KPI Grid */}
            <KPIGrid
              kpis={kpis}
              groupALabel={dataset.sourceConfig.groupA.label}
              groupBLabel={dataset.sourceConfig.groupB.label}
              groupAColor={dataset.sourceConfig.groupA.color}
              groupBColor={dataset.sourceConfig.groupB.color}
            />

            {/* Comparison Chart */}
            {selectedTemplate !== 'sideby_detailed' && (
              <ComparisonChart
                kpis={kpis}
                groupALabel={dataset.sourceConfig.groupA.label}
                groupBLabel={dataset.sourceConfig.groupB.label}
                groupAColor={dataset.sourceConfig.groupA.color}
                groupBColor={dataset.sourceConfig.groupB.color}
              />
            )}

            {/* Comparison Table */}
            <ComparisonTable
              data={filteredData}
              kpiFields={dataset.schemaMapping?.kpiFields || []}
              groupALabel={dataset.sourceConfig.groupA.label}
              groupBLabel={dataset.sourceConfig.groupB.label}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
```

---

## ✅ Task 7.4: Crear componentes del dashboard

### Componente 1: TemplateSelector

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/TemplateSelector.tsx`

```typescript
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, TrendingUp, Table } from 'lucide-react';
import { DashboardTemplateId, DASHBOARD_TEMPLATES } from '../../types/dashboard.types';

interface TemplateSelectorProps {
  selectedTemplate: DashboardTemplateId;
  onSelectTemplate: (template: DashboardTemplateId) => void;
}

const ICON_MAP = {
  BarChart3,
  TrendingUp,
  Table,
};

/**
 * Selector de plantillas de dashboard
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  return (
    <Select value={selectedTemplate} onValueChange={onSelectTemplate}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Seleccionar vista..." />
      </SelectTrigger>
      <SelectContent>
        {Object.values(DASHBOARD_TEMPLATES).map((template) => {
          const Icon = ICON_MAP[template.icon as keyof typeof ICON_MAP];
          return (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
```

### Componente 2: DashboardFiltersBar

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/DashboardFiltersBar.tsx`

```typescript
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dataset } from '../../models/Dataset';

interface DashboardFiltersBarProps {
  categoricalFields: string[];
  filters: Record<string, string>;
  onFilterChange: (field: string, value: string) => void;
  dataset: Dataset;
}

/**
 * Barra de filtros categóricos
 */
export const DashboardFiltersBar: React.FC<DashboardFiltersBarProps> = ({
  categoricalFields,
  filters,
  onFilterChange,
  dataset,
}) => {
  /**
   * Obtiene valores únicos para cada campo categórico
   */
  const getUniqueValues = (field: string): string[] => {
    if (!dataset.data) return [];
    const uniqueSet = new Set<string>();
    dataset.data.forEach((row) => {
      if (row[field]) {
        uniqueSet.add(row[field]);
      }
    });
    return Array.from(uniqueSet).sort();
  };

  if (categoricalFields.length === 0) {
    return null; // No mostrar si no hay filtros
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoricalFields.slice(0, 4).map((field) => {
            const uniqueValues = getUniqueValues(field);
            
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor={`filter-${field}`} className="text-xs uppercase text-muted-foreground">
                  {field}
                </Label>
                <Select
                  value={filters[field] || 'all'}
                  onValueChange={(value) => onFilterChange(field, value)}
                >
                  <SelectTrigger id={`filter-${field}`}>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Componente 3: KPIGrid

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/KPIGrid.tsx`

```typescript
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { KPIResult } from '../../types/dashboard.types';

interface KPIGridProps {
  kpis: KPIResult[];
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
}

/**
 * Grid de tarjetas KPI con comparación
 */
export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('es-ES').format(value);
      default:
        return String(value);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.name}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {/* Header */}
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </div>

              {/* Values */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: groupAColor }}
                    />
                    <span className="text-xs font-medium">{groupALabel}</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatValue(kpi.valueA, kpi.format)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: groupBColor }}
                    />
                    <span className="text-xs font-medium">{groupBLabel}</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatValue(kpi.valueB, kpi.format)}
                  </span>
                </div>
              </div>

              {/* Trend */}
              <div className="pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {kpi.trend === 'up' && (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  )}
                  {kpi.trend === 'down' && (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
                  {kpi.trend === 'neutral' && (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      kpi.trend === 'up'
                        ? 'text-green-600'
                        : kpi.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {kpi.diffPercent > 0 ? '+' : ''}
                    {kpi.diffPercent.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatValue(Math.abs(kpi.diff), kpi.format)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

### Componente 4: ComparisonChart

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/ComparisonChart.tsx`

```typescript
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KPIResult } from '../../types/dashboard.types';

interface ComparisonChartProps {
  kpis: KPIResult[];
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
}

/**
 * Gráfico de barras comparativo
 * (Simplicado con CSS, sin librería de charts)
 */
export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  kpis,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  if (kpis.length === 0) return null;

  // Normalizar valores para el gráfico (0-100%)
  const maxValue = Math.max(
    ...kpis.flatMap((kpi) => [kpi.valueA, kpi.valueB])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparación Visual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {kpis.map((kpi) => {
            const percentA = (kpi.valueA / maxValue) * 100;
            const percentB = (kpi.valueB / maxValue) * 100;

            return (
              <div key={kpi.name} className="space-y-2">
                <p className="text-sm font-medium">{kpi.label}</p>
                
                <div className="space-y-1.5">
                  {/* Bar A */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12 text-right text-muted-foreground">
                      {groupALabel}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentA}%`,
                          backgroundColor: groupAColor,
                        }}
                      />
                    </div>
                    <span className="text-xs w-20 font-medium">
                      {kpi.valueA.toLocaleString()}
                    </span>
                  </div>

                  {/* Bar B */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12 text-right text-muted-foreground">
                      {groupBLabel}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentB}%`,
                          backgroundColor: groupBColor,
                        }}
                      />
                    </div>
                    <span className="text-xs w-20 font-medium">
                      {kpi.valueB.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Componente 5: ComparisonTable

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/ComparisonTable.tsx`

```typescript
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ComparisonTableProps {
  data: any[];
  kpiFields: Array<{ originalName: string; label?: string; format?: string }>;
  groupALabel: string;
  groupBLabel: string;
}

/**
 * Tabla de comparación detallada
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  data,
  kpiFields,
  groupALabel,
  groupBLabel,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No hay datos para mostrar con los filtros aplicados
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayData = isExpanded ? data : data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tabla Detallada</CardTitle>
          {data.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  Ver {data.length - 10} más
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium">
                  Grupo
                </th>
                {kpiFields.map((field) => (
                  <th
                    key={field.originalName}
                    className="text-right py-2 px-3 text-sm font-medium"
                  >
                    {field.label || field.originalName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 text-sm">
                    {row.__group === 'A' ? groupALabel : groupBLabel}
                  </td>
                  {kpiFields.map((field) => (
                    <td
                      key={field.originalName}
                      className="py-2 px-3 text-sm text-right font-mono"
                    >
                      {row[field.originalName] !== undefined
                        ? Number(row[field.originalName]).toLocaleString()
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## ✅ Task 7.5: Tests del dashboard

### Test del hook useDatasetDashboard

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/__tests__/useDatasetDashboard.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDatasetDashboard } from '../useDatasetDashboard';
import { createQueryClientWrapper } from '@/test/utils/react-query';
import * as api from '../../services/datasets.api';

const mockDataset = {
  id: '123',
  ownerId: 'user1',
  status: 'ready' as const,
  meta: { name: 'Test', createdAt: new Date(), updatedAt: new Date() },
  sourceConfig: {
    groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 2 },
    groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 2 },
  },
  schemaMapping: {
    kpiFields: [
      { originalName: 'revenue', label: 'Ingresos', format: 'currency' as const },
    ],
  },
  data: [
    { __group: 'A', revenue: 1000, region: 'Norte' },
    { __group: 'A', revenue: 2000, region: 'Sur' },
    { __group: 'B', revenue: 800, region: 'Norte' },
    { __group: 'B', revenue: 1200, region: 'Sur' },
  ],
};

describe('useDatasetDashboard', () => {
  it('debe calcular KPIs correctamente', async () => {
    vi.spyOn(api, 'getDataset').mockResolvedValue(mockDataset);

    const { result } = renderHook(
      () =>
        useDatasetDashboard({
          datasetId: '123',
          templateId: 'sideby_executive',
          filters: { categorical: {} },
        }),
      { wrapper: createQueryClientWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.kpis).toHaveLength(1);
    expect(result.current.kpis[0]).toMatchObject({
      name: 'revenue',
      label: 'Ingresos',
      valueA: 3000, // 1000 + 2000
      valueB: 2000, // 800 + 1200
      diff: 1000,
      diffPercent: 50, // (3000 - 2000) / 2000 * 100
      format: 'currency',
      trend: 'up',
    });
  });

  it('debe filtrar datos correctamente', async () => {
    vi.spyOn(api, 'getDataset').mockResolvedValue(mockDataset);

    const { result } = renderHook(
      () =>
        useDatasetDashboard({
          datasetId: '123',
          templateId: 'sideby_executive',
          filters: { categorical: { region: 'Norte' } },
        }),
      { wrapper: createQueryClientWrapper() }
    );

    await waitFor(() => {
      expect(result.current.filteredData).toHaveLength(2);
    });

    expect(result.current.filteredData.every((row) => row.region === 'Norte')).toBe(true);
  });

  it('debe detectar campos categóricos', async () => {
    vi.spyOn(api, 'getDataset').mockResolvedValue(mockDataset);

    const { result } = renderHook(
      () =>
        useDatasetDashboard({
          datasetId: '123',
          templateId: 'sideby_executive',
          filters: { categorical: {} },
        }),
      { wrapper: createQueryClientWrapper() }
    );

    await waitFor(() => {
      expect(result.current.categoricalFields).toContain('region');
    });
  });
});
```

**Ejecutar tests:**
```bash
npm test -- useDatasetDashboard
```

---

## ✅ Task 7.6: Validación Manual

### Checklist de funcionalidades

```bash
# Iniciar servers
cd solution-sideby/apps/api
npm run dev

cd solution-sideby/apps/client
npm run dev
```

**Flujo a probar:**

1. **Template Switcher:**
   - [ ] Cambiar de "Executive" a "Trends" → KPIs cambian
   - [ ] Cambiar a "Detailed" → Tabla se expande

2. **Filtros categóricos:**
   - [ ] Aplicar filtro "Region = Norte" → KPIs se recalculan
   - [ ] Aplicar múltiples filtros → Comportamiento acumulativo
   - [ ] Reset filtro a "Todos" → Datos completos

3. **KPI Grid:**
   - [ ] Valores A y B mostrados correctamente
   - [ ] Diferencia porcentual calcula bien
   - [ ] Trend icon correcto (up/down/neutral)
   - [ ] Formatos (currency, percentage, number)

4. **Comparison Chart:**
   - [ ] Barras proporcionales a valores
   - [ ] Colores correctos (groupA/groupB)
   - [ ] Labels visibles

5. **Comparison Table:**
   - [ ] Primeras 10 filas por defecto
   - [ ] "Ver más" expande tabla completa
   - [ ] Hover state en filas

---

## 🎯 Checklist del Día 6-7

- [ ] Tipos de dashboard definidos
- [ ] Hook useDatasetDashboard implementado
- [ ] DatasetDashboard page completa
- [ ] 5 componentes implementados (Selector, Filters, Grid, Chart, Table)
- [ ] KPIs calculados correctamente (sum, diff, %)
- [ ] Filtros aplicados correctamente
- [ ] Tests del hook pasando
- [ ] Validación manual completada (5 secciones)

---

## 📍 Estado Esperado al Finalizar

✅ **Dashboard con templates funcional**  
✅ **3 vistas disponibles (Executive, Trends, Detailed)**  
✅ **Filtros categóricos dinámicos**  
✅ **KPIs con comparación A vs B**  
✅ **Gráficos visuales responsive**  
✅ **Tabla detallada con pagination**

---

## 🚨 Troubleshooting

### Problema: KPIs siempre en 0

**Causa:** Campo `__group` no existe en los datos

**Solución:** Verificar que el backend agrega `__group: 'A' | 'B'` a cada fila

---

### Problema: Filtros no recalculan KPIs

**Causa:** `filteredData` no se usa en cálculo de KPIs

**Solución:** Verificar que `useMemo` de kpis depende de `filteredData`

---

### Problema: Chart no muestra barras

**Causa:** `maxValue` es 0 (división por cero)

**Solución:** Agregar validación para evitar NaN

---

## ✨ Siguiente Paso

**Finalmente, tests de integración E2E:**  
📄 **`docs/design/prompts/PHASE-8-INTEGRATION-TESTS.md`**

---

## 📝 Commit Sugerido

```bash
git add .
git commit -m "feat(dashboard): implement template system

- Created 3 dashboard templates (Executive, Trends, Detailed)
- Implemented dynamic categorical filters
- Added KPI grid with A vs B comparison
- Implemented comparison chart with CSS bars
- Added detailed comparison table with pagination
- Calculated KPIs with diff and trend indicators
- All dashboard tests passing

Features:
- Template switcher with 3 views
- Real-time KPI recalculation on filter change
- Responsive design (mobile-first)
- Professional UX with loading/error states
"
```

---

**¡Excelente! El dashboard está completo. Último paso: tests E2E. 🚀**
