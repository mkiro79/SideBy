/**
 * TrendsGrid - Grid 2×2 de mini-charts con tendencias
 * 
 * Organiza los KPIs principales en un grid responsive
 * mostrando hasta 4 KPIs con sus tendencias temporales.
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card.js';
import { MiniTrendChart } from './MiniTrendChart.js';
import type { DataRow } from '../../types/api.types.js';
import type { KPIResult } from '../../types/dashboard.types.js';

interface TrendsGridProps {
  /** Array de KPIs calculados (se mostrarán los primeros 4) */
  kpis: KPIResult[];
  
  /** Datos temporales para los gráficos */
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

export function TrendsGrid({
  kpis,
  data,
  dateField,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}: TrendsGridProps) {
  // Tomar solo los primeros 4 KPIs para el grid 2×2
  const topKPIs = React.useMemo(() => {
    return kpis.slice(0, 4);
  }, [kpis]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Tendencias Temporales</CardTitle>
      </CardHeader>
      <CardContent>
        {topKPIs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay KPIs disponibles para mostrar tendencias
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topKPIs.map((kpi) => (
              <MiniTrendChart
                key={kpi.name}
                kpi={kpi}
                data={data}
                dateField={dateField}
                groupALabel={groupALabel}
                groupBLabel={groupBLabel}
                groupAColor={groupAColor}
                groupBColor={groupBColor}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
