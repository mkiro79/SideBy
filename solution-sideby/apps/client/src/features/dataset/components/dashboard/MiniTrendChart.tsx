/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Temporal workaround for Recharts 2.15.0 type compatibility issues with React 18
/**
 * MiniTrendChart - Card compacto para grid de tendencias
 * 
 * Muestra un KPI con:
 * - Título y valor principal
 * - Badge con delta porcentual y dirección
 * - Mini gráfico de líneas temporal (2 grupos)
 * 
 * Usa Date Umbrella System para alinear fechas de diferentes años.
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { createDateUmbrella, type DateGranularity } from '../../utils/dateUmbrella.js';
import type { DataRow } from '../../types/api.types.js';
import type { KPIResult } from '../../types/dashboard.types.js';

interface MiniTrendChartProps {
  /** KPI a mostrar */
  kpi: KPIResult;
  
  /** Datos temporales para el gráfico */
  data: DataRow[];
  
  /** Nombre del campo de fecha */
  dateField: string;
  
  /** Granularidad temporal (days, weeks, months, quarters) */
  granularity: DateGranularity;
  
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
  if (Number.isNaN(value) || !Number.isFinite(value)) {
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

export function MiniTrendChart({
  kpi,
  data,
  dateField,
  granularity,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}: MiniTrendChartProps) {
  const isPositive = kpi.diffPercent > 0;
  const isNegative = kpi.diffPercent < 0;

  /**
   * Retorna el ícono de tendencia basado en el cambio porcentual
   */
  const getTrendIcon = () => {
    if (isPositive) return <TrendingUp className="h-3 w-3" />;
    if (isNegative) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  /**
   * Retorna la variante del badge según el cambio porcentual
   */
  const getBadgeVariant = (): 'success' | 'destructive' | 'secondary' => {
    if (isPositive) return 'success';
    if (isNegative) return 'destructive';
    return 'secondary';
  };

  /**
   * Usa Date Umbrella System para alinear fechas de diferentes años
   * y agregar datos por fecha con suma de valores
   */
  const chartData = React.useMemo(() => {
    if (data.length === 0) return [];

    // Separar datos por grupo
    const groupAData = data.filter(row => row._source_group === 'groupA');
    const groupBData = data.filter(row => row._source_group === 'groupB');

    // Aplicar Date Umbrella para alinear fechas
    const umbrellaPoints = createDateUmbrella(
      groupAData,
      groupBData,
      dateField,
      kpi.name, // KPI de este mini-chart
      granularity, // Usar granularidad seleccionada
      false,  // No omitir gaps - mostrar TODOS los períodos
    );

    // Transformar UmbrellaDatePoint[] a formato compatible con Recharts
    return umbrellaPoints.map(point => ({
      date: point.label, // Usar label (ej: "15/01") para eje X
      [groupALabel]: point.groupA?.value || 0,
      [groupBLabel]: point.groupB?.value || 0,
    }));
  }, [data, dateField, kpi.name, granularity, groupALabel, groupBLabel]);

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
          <Badge variant={getBadgeVariant()} className="gap-1">
            {getTrendIcon()}
            {Number.isFinite(kpi.diffPercent) ? (
              <>
                {isPositive ? '+' : ''}
                {kpi.diffPercent.toFixed(1)}%
              </>
            ) : (
              'N/A'
            )}
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
