/**
 * KPIGrid - Grid de tarjetas KPI con comparación A vs B
 * 
 * Muestra cada KPI con valores de ambos grupos, diferencia y tendencia
 */

import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card.js';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { KPIResult } from '../../types/dashboard.types.js';

interface KPIGridProps {
  kpis: KPIResult[];
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('es-ES').format(value);
      default:
        return String(value);
    }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.name}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {/* Header */}
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </div>

              {/* Values */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: groupAColor }}
                    />
                    <span className="text-xs font-medium">{groupALabel}</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatValue(kpi.valueA, kpi.format)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: groupBColor }}
                    />
                    <span className="text-xs font-medium">{groupBLabel}</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatValue(kpi.valueB, kpi.format)}
                  </span>
                </div>
              </div>

              {/* Trend */}
              <div className="pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {kpi.trend === 'up' && (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  )}
                  {kpi.trend === 'down' && (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
                  {kpi.trend === 'neutral' && (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      kpi.trend === 'up'
                        ? 'text-green-600'
                        : kpi.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {kpi.diffPercent > 0 ? '+' : ''}
                    {kpi.diffPercent.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatValue(Math.abs(kpi.diff), kpi.format)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
