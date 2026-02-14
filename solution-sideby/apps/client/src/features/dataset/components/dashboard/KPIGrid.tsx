/**
 * KPIGrid - Grid de tarjetas KPI con comparación A vs B
 * 
 * Diseño: Icono arriba-derecha, valor grande, "vs. $XXX", badge cambio %
 */

import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card.js';
import { ArrowUp, ArrowDown, Minus, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge.js';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { LucideIcon } from 'lucide-react';

interface KPIGridProps {
  kpis: KPIResult[];
  groupALabel?: string;
  groupBLabel?: string;
  groupAColor: string;
  groupBColor: string;
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

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
}) => {
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
        if (value >= 1000) {
          return `${(value / 1000).toFixed(0)}K`;
        }
        return new Intl.NumberFormat('es-ES').format(value);
      default:
        return String(value);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <ArrowUp className="h-3 w-3" />;
    if (trend === 'down') return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getBadgeVariant = (trend: 'up' | 'down' | 'neutral'): 'success' | 'destructive' | 'secondary' => {
    if (trend === 'up') return 'success';
    if (trend === 'down') return 'destructive';
    return 'secondary';
  };

  if (kpis.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay KPIs para mostrar
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = getKPIIcon(kpi.name);
        
        return (
          <Card key={kpi.name}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <div className="space-y-1">
                    <p className="text-3xl font-semibold tracking-tight">
                      {formatValue(kpi.valueA, kpi.format)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      vs. {formatValue(kpi.valueB, kpi.format)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Badge variant={getBadgeVariant(kpi.trend)} className="gap-1">
                    {getTrendIcon(kpi.trend)}
                    {kpi.diffPercent > 0 ? '+' : ''}
                    {kpi.diffPercent.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
