/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Temporal workaround for Recharts 2.15.0 type compatibility issues with React 18
/**
 * MiniTrendChart - Card compacto para grid de tendencias
 * 
 * Muestra un KPI con:
 * - Título y valor principal
 * - Badge con delta porcentual y dirección
 * - Mini gráfico de líneas temporal (2 grupos)
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DataRow } from '../../types/api.types.js';
import type { KPIResult } from '../../types/dashboard.types.js';

interface MiniTrendChartProps {
  /** KPI a mostrar */
  kpi: KPIResult;
  
  /** Datos temporales para el gráfico */
  data: DataRow[];
  
  /** Nombre del campo de fecha */
  dateField: string;
  
  /** Label del grupo A (ej: "2023") */
  groupALabel: string;
  
  /** Label del grupo B (ej: "2024") */
  groupBLabel: string;
  
  /** Color de la línea del grupo A */
  groupAColor: string;
  
  /** Color de la línea del grupo B */
  groupBColor: string;
}

/**
 * Formatea un valor según su tipo
 */
function formatValue(value: number, format: 'currency' | 'percentage' | 'number' | 'text'): string {
  if (isNaN(value) || !isFinite(value)) {
    return '—';
  }

  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'text':
      return value.toString();
    
    case 'number':
    default:
      return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}

/**
 * Prepara datos para el gráfico temporal
 * Agrupa por fecha y calcula valores para cada grupo
 */
function prepareChartData(
  data: DataRow[],
  dateField: string,
  kpiField: string,
  groupALabel: string,
  groupBLabel: string
): Array<{ date: string; [key: string]: string | number }> {
  if (!data || data.length === 0) {
    return [];
  }

  // Agrupar por fecha
  const dateMap = new Map<string, { groupA: number[], groupB: number[] }>();

  data.forEach((row) => {
    const dateValue = row[dateField];
    if (!dateValue) return;

    const dateStr = String(dateValue);
    
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { groupA: [], groupB: [] });
    }

    const group = dateMap.get(dateStr)!;
    const value = Number(row[kpiField]) || 0;

    if (row._source_group === 'groupA') {
      group.groupA.push(value);
    } else if (row._source_group === 'groupB') {
      group.groupB.push(value);
    }
  });

  // Calcular promedios y construir array final
  const chartData = Array.from(dateMap.entries()).map(([date, groups]) => {
    const avgA = groups.groupA.length > 0
      ? groups.groupA.reduce((sum, val) => sum + val, 0) / groups.groupA.length
      : 0;
    
    const avgB = groups.groupB.length > 0
      ? groups.groupB.reduce((sum, val) => sum + val, 0) / groups.groupB.length
      : 0;

    return {
      date,
      [groupALabel]: avgA,
      [groupBLabel]: avgB,
    };
  });

  // Ordenar por fecha
  return chartData.sort((a, b) => a.date.localeCompare(b.date));
}

export function MiniTrendChart({
  kpi,
  data,
  dateField,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}: MiniTrendChartProps) {
  const isPositive = kpi.diffPercent > 0;
  const isNegative = kpi.diffPercent < 0;

  // Preparar datos para el gráfico
  const chartData = React.useMemo(() => {
    return prepareChartData(data, dateField, kpi.name, groupALabel, groupBLabel);
  }, [data, dateField, kpi.name, groupALabel, groupBLabel]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">{kpi.label}</h4>
            <p className="text-2xl font-bold mt-1">
              {formatValue(kpi.valueB, kpi.format)}
            </p>
          </div>
          <Badge variant={isPositive ? 'default' : isNegative ? 'destructive' : 'secondary'}>
            {isPositive ? '↗️' : isNegative ? '↘️' : '→'} {isPositive ? '+' : ''}{kpi.diffPercent.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey={groupALabel}
              stroke={groupAColor}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={groupBLabel}
              stroke={groupBColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
