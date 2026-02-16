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
 * Muestra gráfico de barras agrupadas comparando Grupo A vs Grupo B
 * para cada valor de la dimensión seleccionada.
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { DataRow } from '../../types/api.types.js';

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
    
    switch (selectedKpi.format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      case 'number':
        return new Intl.NumberFormat('es-ES').format(value);
      
      default:
        return String(value);
    }
  };
  
  /**
   * Formatear valores para tooltip
   */
  const formatTooltipValue = (value: number): string => {
    return formatValue(value);
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
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatTooltipValue(value), '']}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                }}
                iconType="circle"
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
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
