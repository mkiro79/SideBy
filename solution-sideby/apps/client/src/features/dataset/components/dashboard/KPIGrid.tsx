/**
 * KPIGrid - Grid de tarjetas KPI con comparación A vs B
 * 
 * Usa componente KPICard para diseño consistente y limpio
 */

import React from 'react';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { LucideIcon } from 'lucide-react';
import { KPICard } from '../KPICard.js';

interface KPIGridProps {
  kpis: KPIResult[];
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

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  if (kpis.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No hay KPIs para mostrar
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const icon = getKPIIcon(kpi.name);

        return (
          <KPICard
            key={kpi.name}
            title={kpi.label}
            currentValue={formatValue(kpi.valueA, kpi.format)}
            comparativeValue={formatValue(kpi.valueB, kpi.format)}
            percentageChange={kpi.diffPercent}
            icon={icon}
          />
        );
      })}
    </div>
  );
};
