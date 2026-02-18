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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
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
import type { KPIResult } from '../../types/dashboard.types.js';
import { formatKpiValue } from '../../utils/numberFormat.js';
import { UnifiedChartTooltip } from './UnifiedChartTooltip.js';

interface TrendChartProps {
  data: DataRow[];
  dateField: string;
  kpis: KPIResult[]; // Todos los KPIs disponibles
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  dateField,
  kpis,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  // Estado para granularidad seleccionada
  const [granularity, setGranularity] = useState<DateGranularity>('months');
  
  // Estado para KPI seleccionado
  const [selectedKpiName, setSelectedKpiName] = useState<string>(kpis[0]?.name || '');
  
  // KPI actualmente seleccionado
  const selectedKpi = kpis.find(k => k.name === selectedKpiName) || kpis[0];
  const format = selectedKpi?.format || 'number';

  // Helper para convertir hsl a rgba con opacidad
  const hslToRgba = (hslColor: string, opacity: number): string => {
    // Si ya es rgba, devolver tal cual
    if (hslColor.startsWith('rgba')) return hslColor;
    
    // Crear elemento temporal para obtener color computado
    const temp = document.createElement('div');
    temp.style.color = hslColor;
    document.body.appendChild(temp);
    const computed = getComputedStyle(temp).color;
    temp.remove();
    
    // Extraer rgb values y agregar alpha
    const rgbRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
    const match = rgbRegex.exec(computed);
    if (match) {
      return `rgba(${ match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
    
    return hslColor; // Fallback
  };

  const groupBColorFaded = React.useMemo(
    () => hslToRgba(groupBColor, 0.45),
    [groupBColor]
  );

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
      selectedKpi.name, // KPI seleccionado
      granularity, // Usar granularidad seleccionada
      true,  // Omitir gaps para no renderizar periodos sin datos
    );

    // Transformar UmbrellaDatePoint[] a formato compatible con Recharts
    return umbrellaPoints.map(point => ({
      date: point.label, // Usar label (ej: "Ene", "15/01") para eje X
      groupA: point.groupA?.value ?? 0,
      groupB: point.groupB?.value ?? 0,
    }));
  }, [data, dateField, selectedKpi.name, granularity]);

  const formatValue = (value: number): string =>
    formatKpiValue(value, format, { compact: true });

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
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">Tendencia de</CardTitle>
              <Select value={selectedKpiName} onValueChange={setSelectedKpiName}>
                <SelectTrigger className="w-[200px] h-9">
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
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore - Recharts 2.x has type compatibility issues with React 18 */}
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore - Recharts 2.x has type compatibility issues with React 18 */}
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore - Recharts 2.x has type compatibility issues with React 18 */}
              <Tooltip
                {...({ content: <UnifiedChartTooltip valueFormat={format} percentageDecimals={2} /> } as Record<string, unknown>)}
              />
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore - Recharts 2.x has type compatibility issues with React 18 */}
              <Line
                type="monotone"
                dataKey="groupA"
                name={groupALabel}
                stroke={groupAColor}
                strokeWidth={2.5}
                dot={{ r: 3, fill: groupAColor }}
                activeDot={{ r: 5, fill: groupAColor }}
              />
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore - Recharts 2.x has type compatibility issues with React 18 */}
              <Line
                type="monotone"
                dataKey="groupB"
                name={groupBLabel}
                stroke={groupBColorFaded}
                strokeWidth={2}
                dot={{ r: 2.5, fill: groupBColorFaded }}
                activeDot={{ r: 4, fill: groupBColorFaded }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
