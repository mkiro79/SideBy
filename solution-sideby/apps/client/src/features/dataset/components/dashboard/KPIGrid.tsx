/**
 * KPIGrid - Grid de tarjetas KPI con comparación A vs B
 * 
 * Diseño: Usa componente KPICard con soporte para sparklines
 * Genera datos temporales para visualizar tendencias históricas
 */

import React from 'react';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { LucideIcon } from 'lucide-react';
import { KPICard } from '../KPICard.js';

interface KPIGridProps {
  kpis: KPIResult[];
  groupALabel?: string;
  groupBLabel?: string;
  /** Datos filtrados para generar sparklines (opcional) */
  data?: Record<string, unknown>[];
  /** Campo de fecha para agrupar sparklines (opcional) */
  dateField?: string;
  /** Campo del grupo de comparación */
  groupField?: string;
  /** Valor del Grupo A */
  groupAValue?: string;
  /** Valor del Grupo B */
  groupBValue?: string;
}

/**
 * Mapea nombre de KPI a ícono
 */
const getKPIIcon = (kpiName: string): LucideIcon => {
  const name = kpiName.toLowerCase();
  if (name.includes('revenue') || name.includes('ventas') || name.includes('ingreso')) {
    return DollarSign;
  }
  if (name.includes('user') || name.includes('usuario') || name.includes('tráfico') || name.includes('trafico')) {
    return Users;
  }
  if (name.includes('roi') || name.includes('growth') || name.includes('crecimiento')) {
    return TrendingUp;
  }
  return Activity;
};

/**
 * Genera sparkline data para un KPI desde datos temporales
 * Toma los últimos N puntos de datos del Grupo A ordenados por fecha
 */
const generateSparklineData = (
  data: Record<string, unknown>[],
  dateField: string,
  groupField: string,
  groupAValue: string,
  kpiName: string
): number[] => {
  try {
    // Filtrar por Grupo A
    const groupAData = data.filter(
      (row) => String(row[groupField]) === groupAValue
    );

    // Ordenar por fecha (ascendente)
    const sortedData = [...groupAData].sort((a, b) => {
      const dateA = new Date(String(a[dateField])).getTime();
      const dateB = new Date(String(b[dateField])).getTime();
      return dateA - dateB;
    });

    // Extraer valores del KPI (últimos 30 puntos máximo)
    const values = sortedData
      .slice(-30) // Últimos 30 puntos
      .map((row) => {
        const value = row[kpiName];
        return typeof value === 'number' ? value : 0;
      })
      .filter((v) => !isNaN(v) && isFinite(v));

    return values.length > 0 ? values : [];
  } catch {
    return [];
  }
};

/**
 * Formatea valor según su tipo
 */
const formatValue = (value: number, format: string): string => {
  switch (format) {
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
      if (value >= 10000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
      return new Intl.NumberFormat('es-ES').format(value);
    default:
      return String(value);
  }
};

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  groupALabel = 'Actual',
  groupBLabel = 'Comparativo',
  data = [],
  dateField = '',
  groupField = '',
  groupAValue = '',
  // groupBValue podría usarse en el futuro para sparklines comparativas
}) => {
  if (kpis.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No hay KPIs para mostrar
      </div>
    );
  }

  // Determinar si tenemos datos suficientes para sparklines
  const hasSparklineData = data.length > 0 && dateField && groupField && groupAValue;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const icon = getKPIIcon(kpi.name);
        
        // Generar sparkline data si hay datos temporales
        const sparklineData = hasSparklineData
          ? generateSparklineData(data, dateField, groupField, groupAValue, kpi.name)
          : [];

        return (
          <KPICard
            key={kpi.name}
            title={kpi.label}
            currentValue={formatValue(kpi.valueA, kpi.format)}
            comparativeValue={formatValue(kpi.valueB, kpi.format)}
            percentageChange={kpi.diffPercent}
            icon={icon}
            groupALabel={groupALabel}
            groupBLabel={groupBLabel}
            sparklineData={sparklineData}
          />
        );
      })}
    </div>
  );
};
