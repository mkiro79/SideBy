/**
 * ComparisonChart - Gráfico de barras comparativo con CSS
 * 
 * Visualiza KPIs con barras horizontales proporcionales
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import type { KPIResult } from '../../types/dashboard.types.js';

interface ComparisonChartProps {
  kpis: KPIResult[];
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  kpis,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  if (kpis.length === 0) return null;

  // Normalizar valores para el gráfico (0-100%)
  const maxValue = Math.max(
    ...kpis.flatMap((kpi) => [kpi.valueA, kpi.valueB])
  );

  if (maxValue === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparación Visual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {kpis.map((kpi) => {
            const percentA = (kpi.valueA / maxValue) * 100;
            const percentB = (kpi.valueB / maxValue) * 100;

            return (
              <div key={kpi.name} className="space-y-2">
                <p className="text-sm font-medium">{kpi.label}</p>
                
                <div className="space-y-1.5">
                  {/* Bar A */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12 text-right text-muted-foreground">
                      {groupALabel}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentA}%`,
                          backgroundColor: groupAColor,
                        }}
                      />
                    </div>
                    <span className="text-xs w-20 font-medium">
                      {kpi.valueA.toLocaleString()}
                    </span>
                  </div>

                  {/* Bar B */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12 text-right text-muted-foreground">
                      {groupBLabel}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentB}%`,
                          backgroundColor: groupBColor,
                        }}
                      />
                    </div>
                    <span className="text-xs w-20 font-medium">
                      {kpi.valueB.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
