/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Temporal workaround for Recharts 2.15.0 type compatibility issues with React 18
/**
 * CategoryChart - Análisis de KPIs por dimensiones categóricas
 * 
 * Permite analizar cualquier KPI desglosado por dimensiones como:
 * - Región
 * - Canal
 * - Producto
 * - etc.
 * 
 * Soporta visualización en Barras, Líneas o Área
 */

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { DataRow } from '../../types/api.types.js';
import type { ChartType } from './DimensionGrid.js';
import { formatKpiValue } from '../../utils/numberFormat.js';
import { UnifiedChartTooltip } from './UnifiedChartTooltip.js';

interface CategoryChartProps {
  /** Array de datos filtrados */
  data: DataRow[];
  
  /** KPIs disponibles */
  kpis: KPIResult[];
  
  /** Dimensiones categóricas disponibles */
  dimensions: string[];
  
  /** Labels de grupos */
  groupALabel: string;
  groupBLabel: string;
  
  /** Colores de grupos */
  groupAColor: string;
  groupBColor: string;
}

interface CategoryDataPoint {
  /** Nombre de la categoría (ej: "Norte", "Sur") */
  category: string;
  
  /** Valor agregado del Grupo A */
  groupA: number;
  
  /** Valor agregado del Grupo B */
  groupB: number;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  kpis,
  dimensions,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  // Estado para dimensión seleccionada
  const [selectedDimension, setSelectedDimension] = useState<string>(
    dimensions[0] || ''
  );
  
  // Estado para KPI seleccionado
  const [selectedKpiName, setSelectedKpiName] = useState<string>(
    kpis[0]?.name || ''
  );
  
  // Estado para tipo de gráfico
  const [chartType, setChartType] = useState<ChartType>('bar');
  
  // KPI actualmente seleccionado
  const selectedKpi = kpis.find(k => k.name === selectedKpiName) || kpis[0];
  
  /**
   * Agregar datos por dimensión seleccionada
   */
  const chartData = useMemo((): CategoryDataPoint[] => {
    if (!selectedDimension || !selectedKpi || data.length === 0) {
      return [];
    }
    
    // Agrupar por valor de dimensión
    const grouped = new Map<string, { groupA: number; groupB: number }>();
    
    data.forEach(row => {
      const categoryValue = String(row[selectedDimension] || 'Sin categoría');
      const kpiValue = Number(row[selectedKpi.name]) || 0;
      const group = row._source_group;
      
      if (!grouped.has(categoryValue)) {
        grouped.set(categoryValue, { groupA: 0, groupB: 0 });
      }
      
      const entry = grouped.get(categoryValue)!;
      if (group === 'groupA') {
        entry.groupA += kpiValue;
      } else if (group === 'groupB') {
        entry.groupB += kpiValue;
      }
    });
    
    // Convertir a array y ordenar por nombre de categoría
    return Array.from(grouped.entries())
      .map(([category, values]) => ({
        category,
        groupA: values.groupA,
        groupB: values.groupB,
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [data, selectedDimension, selectedKpi]);
  
  /**
   * Formatear valores según el tipo de KPI
   */
  const formatValue = (value: number): string => {
    if (!selectedKpi) return String(value);
    return formatKpiValue(value, selectedKpi.format, { compact: true });
  };
  
  // Caso: sin dimensiones disponibles
  if (dimensions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No hay dimensiones categóricas para analizar
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Caso: sin datos
  if (data.length === 0 || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análisis por Dimensión</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Sin datos para mostrar
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">Análisis por Dimensión</CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Selector de Dimensión */}
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Dimensión" />
              </SelectTrigger>
              <SelectContent>
                {dimensions.map((dim) => (
                  <SelectItem key={dim} value={dim}>
                    {dim.charAt(0).toUpperCase() + dim.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Selector de KPI */}
            <Select value={selectedKpiName} onValueChange={setSelectedKpiName}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue />
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
              <SelectTrigger className="w-[150px] h-9">
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
                    <AreaChartIcon className="h-4 w-4" />
                    <span>Área</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' && (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatValue}
                />
                <Tooltip
                  content={<UnifiedChartTooltip valueFormat={selectedKpi?.format ?? 'number'} percentageDecimals={2} />}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                  iconType="circle"
                  formatter={(value: string) => value}
                />
                <Bar
                  dataKey="groupA"
                  name={groupALabel}
                  fill={groupAColor}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="groupB"
                  name={groupBLabel}
                  fill={groupBColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
            
            {chartType === 'line' && (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatValue}
                />
                <Tooltip
                  content={<UnifiedChartTooltip valueFormat={selectedKpi?.format ?? 'number'} percentageDecimals={2} />}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                  iconType="circle"
                  formatter={(value: string) => value}
                />
                <Line
                  type="monotone"
                  dataKey="groupA"
                  name={groupALabel}
                  stroke={groupAColor}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="groupB"
                  name={groupBLabel}
                  stroke={groupBColor}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
            
            {chartType === 'area' && (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatValue}
                />
                <Tooltip
                  content={<UnifiedChartTooltip valueFormat={selectedKpi?.format ?? 'number'} percentageDecimals={2} />}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                  iconType="circle"
                  formatter={(value: string) => value}
                />
                <Area
                  type="monotone"
                  dataKey="groupA"
                  name={groupALabel}
                  stroke={groupAColor}
                  fill={groupAColor}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="groupB"
                  name={groupBLabel}
                  stroke={groupBColor}
                  fill={groupBColor}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
