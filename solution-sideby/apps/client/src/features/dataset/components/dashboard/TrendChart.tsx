/**
 * TrendChart - Gráfico de líneas temporal para análisis de tendencias
 * 
 * Visualiza KPIs a lo largo del tiempo con dos líneas comparativas (Grupo A vs B)
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DataRow } from '../../types/api.types.js';

interface TrendChartProps {
  data: DataRow[];
  dateField: string;
  kpiField: string;
  kpiLabel: string;
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
  format?: 'number' | 'currency' | 'percentage';
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  dateField,
  kpiField,
  kpiLabel,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
  format = 'number',
}) => {
  /**
   * Agrupa datos por fecha y suma valores de cada grupo
   */
  const chartData = React.useMemo(() => {
    const grouped = new Map<string, { date: string; sortKey: number; groupA: number; groupB: number }>();

    data.forEach((row) => {
      const rawDateValue = row[dateField];
      if (!rawDateValue) return;
      
      // Intentar parsear como fecha para ordenamiento consistente
      const dateValue = String(rawDateValue);
      let sortKey: number;
      
      try {
        const parsedDate = new Date(dateValue);
        sortKey = isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
      } catch {
        // Si falla el parseo, usar orden lexicográfico
        sortKey = 0;
      }
      
      const kpiValue = Number(row[kpiField]) || 0;
      const group = row._source_group;

      if (!grouped.has(dateValue)) {
        grouped.set(dateValue, { date: dateValue, sortKey, groupA: 0, groupB: 0 });
      }

      const entry = grouped.get(dateValue)!;
      if (group === 'groupA') {
        entry.groupA += kpiValue;
      } else if (group === 'groupB') {
        entry.groupB += kpiValue;
      }
    });

    // Ordenar por timestamp si está disponible, si no por string
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.sortKey && b.sortKey) {
        return a.sortKey - b.sortKey;
      }
      return a.date.localeCompare(b.date);
    });
  }, [data, dateField, kpiField]);

  const formatValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return `€${(value / 1000).toFixed(0)}k`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
      default:
        return value.toLocaleString();
    }
  };

  const formatTooltipValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString();
    }
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No hay datos temporales para mostrar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{kpiLabel}</CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: groupAColor }}
            />
            <span className="text-muted-foreground">{groupALabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: groupBColor }}
            />
            <span className="text-muted-foreground">{groupBLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
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
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatTooltipValue(value), '']}
              />
              <Line
                type="monotone"
                dataKey="groupA"
                name={groupALabel}
                stroke={groupAColor}
                strokeWidth={2.5}
                dot={{ r: 3, fill: groupAColor }}
                activeDot={{ r: 5, fill: groupAColor }}
              />
              <Line
                type="monotone"
                dataKey="groupB"
                name={groupBLabel}
                stroke={groupBColor}
                strokeWidth={2.5}
                dot={{ r: 3, fill: groupBColor }}
                activeDot={{ r: 5, fill: groupBColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
