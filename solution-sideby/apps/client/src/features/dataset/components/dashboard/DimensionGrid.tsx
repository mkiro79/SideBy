/**
 * DimensionGrid - Grid 2×2 de mini-charts por dimensión categórica
 * 
 * Muestra análisis categórico en paralelo:
 * - Selector de KPI
 * - Selector de tipo de gráfico (Barras, Líneas, Área)
 * - 4 dimensiones diferentes en grid 2×2
 * - Cada chart muestra barras comparativas Grupo A vs Grupo B
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/shared/components/ui/card.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import { BarChart3, LineChart as LineChartIcon, AreaChart } from 'lucide-react';
import { MiniDimensionChart } from './MiniDimensionChart.js';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { DataRow } from '../../types/api.types.js';

export type ChartType = 'bar' | 'line' | 'area';

interface DimensionGridProps {
  /** KPIs disponibles */
  kpis: KPIResult[];
  
  /** Datos filtrados */
  data: DataRow[];
  
  /** Dimensiones categóricas disponibles */
  dimensions: string[];
  
  /** Labels de grupos */
  groupALabel: string;
  groupBLabel: string;
  
  /** Colores de grupos */
  groupAColor: string;
  groupBColor: string;
}

export const DimensionGrid: React.FC<DimensionGridProps> = ({
  kpis,
  data,
  dimensions,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  // Seleccionar primer KPI por defecto
  const [selectedKpiName, setSelectedKpiName] = useState<string>(
    kpis[0]?.name || ''
  );

  // Selector de tipo de gráfico
  const [chartType, setChartType] = useState<ChartType>('bar');

  const selectedKpi = kpis.find(k => k.name === selectedKpiName) || kpis[0];

  // Tomar las primeras 4 dimensiones para el grid
  const displayDimensions = dimensions.slice(0, 4);

  /**
   * Capitalizar y formatear nombre de dimensión
   */
  const formatDimensionLabel = (dim: string): string => {
    return dim
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (displayDimensions.length === 0 || !selectedKpi) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header con selector de KPI y tipo de gráfico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg font-semibold">
              Análisis por Dimensión
            </CardTitle>
            <div className="flex items-center gap-3">
              {/* Selector de KPI */}
              <Select value={selectedKpiName} onValueChange={setSelectedKpiName}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecciona KPI" />
                </SelectTrigger>
                <SelectContent>
                  {kpis.map((kpi) => (
                    <SelectItem key={kpi.name} value={kpi.name}>
                      {kpi.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selector de tipo de gráfico */}
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tipo de gráfico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Barras</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="h-4 w-4" />
                      <span>Líneas</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="area">
                    <div className="flex items-center gap-2">
                      <AreaChart className="h-4 w-4" />
                      <span>Área</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid 2×2 de dimensiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayDimensions.map((dimension) => (
          <MiniDimensionChart
            key={dimension}
            dimension={dimension}
            dimensionLabel={formatDimensionLabel(dimension)}
            kpi={selectedKpi}
            data={data}
            groupALabel={groupALabel}
            groupBLabel={groupBLabel}
            groupAColor={groupAColor}
            groupBColor={groupBColor}
            chartType={chartType}
          />
        ))}
      </div>
    </div>
  );
};
