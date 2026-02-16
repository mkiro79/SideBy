/**
 * TrendChart - Gráfico de líneas temporal para análisis de tendencias
 * 
 * Visualiza KPIs a lo largo del tiempo con dos líneas comparativas (Grupo A vs B).
 * Usa Date Umbrella System para alinear fechas de diferentes años.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import { Button } from '@/shared/components/ui/button.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { createDateUmbrella, type DateGranularity } from '../../utils/dateUmbrella.js';
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
  // Estado para granularidad seleccionada
  const [granularity, setGranularity] = useState<DateGranularity>('months');

  /**
   * Usa Date Umbrella System para alinear fechas de diferentes años
   * y agregar datos por fecha con suma de valores
   */
  const chartData = React.useMemo(() => {
    if (data.length === 0) return [];

    // Separar datos por grupo
    const groupAData = data.filter(row => row._source_group === 'groupA');
    const groupBData = data.filter(row => row._source_group === 'groupB');

    // Aplicar Date Umbrella para alinear fechas (devuelve array ya agrupado)
    const umbrellaPoints = createDateUmbrella(
      groupAData,
      groupBData,
      dateField,
      kpiField,
      granularity, // Usar granularidad seleccionada
      false,  // No omitir gaps - mostrar todos los períodos
    );

    // Transformar UmbrellaDatePoint[] a formato compatible con Recharts
    return umbrellaPoints.map(point => ({
      date: point.label, // Usar label (ej: "Ene", "15/01") para eje X
      groupA: point.groupA?.value ?? 0,
      groupB: point.groupB?.value ?? 0,
    }));
  }, [data, dateField, kpiField, granularity]);

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{kpiLabel}</CardTitle>
            <div className="flex items-center gap-4 text-xs mt-2">
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
          </div>

          {/* Selector de Granularidad */}
          <div className="flex items-center gap-1">
            <Button
              variant={granularity === 'days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGranularity('days')}
              className="h-8 text-xs"
            >
              Días
            </Button>
            <Button
              variant={granularity === 'weeks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGranularity('weeks')}
              className="h-8 text-xs"
            >
              Semanas
            </Button>
            <Button
              variant={granularity === 'months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGranularity('months')}
              className="h-8 text-xs"
            >
              Meses
            </Button>
            <Button
              variant={granularity === 'quarters' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGranularity('quarters')}
              className="h-8 text-xs"
            >
              Trimestres
            </Button>
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
