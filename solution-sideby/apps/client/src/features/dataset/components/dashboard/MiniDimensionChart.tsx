/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Temporal workaround for Recharts 2.15.0 type compatibility issues with React 18
/**
 * MiniDimensionChart - Mini gráfico para análisis por dimensión categórica
 * 
 * Versión compacta del CategoryChart para usar en grid 2×2
 * Muestra un KPI específico desglosado por una dimensión (ej: Country, Channel)
 * Soporta visualización en Barras, Líneas o Área
 */

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { DataRow } from '../../types/api.types.js';
import type { ChartType } from './DimensionGrid.js';
import { formatKpiValue } from '../../utils/numberFormat.js';

interface MiniDimensionChartProps {
  /** Nombre de la dimensión a analizar (ej: "country", "channel") */
  dimension: string;
  
  /** Label amigable de la dimensión (ej: "País", "Canal") */
  dimensionLabel: string;
  
  /** KPI a visualizar */
  kpi: KPIResult;
  
  /** Array de datos filtrados */
  data: DataRow[];
  
  /** Labels de grupos */
  groupALabel: string;
  groupBLabel: string;
  
  /** Colores de grupos */
  groupAColor: string;
  groupBColor: string;

  /** Tipo de gráfico a renderizar */
  chartType: ChartType;
}

interface CategoryDataPoint {
  category: string;
  groupA: number;
  groupB: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryDataPoint;
  }>;
}

interface CustomTooltipInnerProps extends TooltipProps {
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
  formatValue: (value: number) => string;
}

/**
 * Tooltip personalizado para MiniDimensionChart
 */
const CustomTooltip: React.FC<CustomTooltipInnerProps> = ({
  active,
  payload,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
  formatValue,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{data.category}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: groupAColor }} />
            {groupALabel}
          </span>
          <span className="font-medium">{formatValue(data.groupA)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: groupBColor }} />
            {groupBLabel}
          </span>
          <span className="font-medium">{formatValue(data.groupB)}</span>
        </div>
      </div>
    </div>
  );
};

export const MiniDimensionChart: React.FC<MiniDimensionChartProps> = ({
  dimension,
  dimensionLabel,
  kpi,
  data,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
  chartType,
}) => {
  /**
   * Agregar datos por dimensión
   */
  const chartData = useMemo((): CategoryDataPoint[] => {
    if (!dimension || !kpi || data.length === 0) {
      return [];
    }
    
    // Agrupar por valor de dimensión
    const grouped = new Map<string, { groupA: number; groupB: number }>();
    
    data.forEach((row) => {
      const categoryValue = String(row[dimension] ?? 'Sin categoría');
      const kpiValue = Number(row[kpi.name]) || 0;
      const sourceGroup = String(row._source_group);
      
      if (!grouped.has(categoryValue)) {
        grouped.set(categoryValue, { groupA: 0, groupB: 0 });
      }
      
      const entry = grouped.get(categoryValue)!;
      if (sourceGroup === 'groupA') {
        entry.groupA += kpiValue;
      } else if (sourceGroup === 'groupB') {
        entry.groupB += kpiValue;
      }
    });
    
    // Convertir a array y ordenar por groupA (descendente)
    return Array.from(grouped.entries())
      .map(([category, values]) => ({
        category,
        groupA: values.groupA,
        groupB: values.groupB,
      }))
      .sort((a, b) => b.groupA - a.groupA)
      .slice(0, 6); // Máximo 6 categorías para mini-chart
  }, [data, dimension, kpi]);

  /**
   * Formatea valores según el formato del KPI
   */
  const formatValue = (value: number): string =>
    formatKpiValue(value, kpi.format, { compact: true });

  const formatTooltipValue = (value: number): string =>
    formatKpiValue(value, kpi.format, { compact: false, percentageDecimals: 2 });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{dimensionLabel}</CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{dimensionLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          {chartType === 'bar' && (
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    groupALabel={groupALabel}
                    groupBLabel={groupBLabel}
                    groupAColor={groupAColor}
                    groupBColor={groupBColor}
                    formatValue={formatTooltipValue}
                  />
                }
              />
              <Bar dataKey="groupA" fill={groupAColor} radius={[4, 4, 0, 0]} />
              <Bar dataKey="groupB" fill={groupBColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}

          {chartType === 'line' && (
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    groupALabel={groupALabel}
                    groupBLabel={groupBLabel}
                    groupAColor={groupAColor}
                    groupBColor={groupBColor}
                    formatValue={formatTooltipValue}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="groupA"
                stroke={groupAColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="groupB"
                stroke={groupBColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}

          {chartType === 'area' && (
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    groupALabel={groupALabel}
                    groupBLabel={groupBLabel}
                    groupAColor={groupAColor}
                    groupBColor={groupBColor}
                    formatValue={formatTooltipValue}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="groupA"
                stroke={groupAColor}
                fill={groupAColor}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="groupB"
                stroke={groupBColor}
                fill={groupBColor}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};