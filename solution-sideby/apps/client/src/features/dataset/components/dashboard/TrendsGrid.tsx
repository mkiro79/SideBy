/**
 * TrendsGrid - Grid 2×2 de mini-charts con tendencias
 * 
 * Organiza los KPIs principales en un grid responsive
 * mostrando hasta 4 KPIs con sus tendencias temporales.
 * Con selector de granularidad temporal (Días, Semanas, Meses, Trimestres).
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card.js';
import { Button } from '@/shared/components/ui/button.js';
import { MiniTrendChart } from './MiniTrendChart.js';
import type { DateGranularity } from '../../utils/dateUmbrella.js';
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
  
  /** Granularidad temporal (controlada desde afuera) */
  granularity?: DateGranularity;
  
  /** Callback para cambio de granularidad */
  onGranularityChange?: (granularity: DateGranularity) => void;
}

export function TrendsGrid({
  kpis,
  data,
  dateField,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
  granularity: externalGranularity,
  onGranularityChange,
}: Readonly<TrendsGridProps>) {
  // Estado para granularidad seleccionada (interno si no es controlado)
  const [internalGranularity, setInternalGranularity] = React.useState<DateGranularity>('months');
  
  // Usar granularidad externa si existe, sino interna
  const granularity = externalGranularity || internalGranularity;
  
  const handleGranularityChange = (newGranularity: DateGranularity) => {
    if (onGranularityChange) {
      onGranularityChange(newGranularity);
    } else {
      setInternalGranularity(newGranularity);
    }
  };
  
  // Tomar solo los primeros 4 KPIs para el grid 2×2
  const topKPIs = React.useMemo(() => {
    return kpis.slice(0, 4);
  }, [kpis]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📈 Tendencias Temporales</CardTitle>
          
          {/* Selector de granularidad */}
          <div className="flex gap-1">
            <Button
              variant={granularity === 'days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGranularityChange('days')}
            >
              Días
            </Button>
            <Button
              variant={granularity === 'weeks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGranularityChange('weeks')}
            >
              Semanas
            </Button>
            <Button
              variant={granularity === 'months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGranularityChange('months')}
            >
              Meses
            </Button>
            <Button
              variant={granularity === 'quarters' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGranularityChange('quarters')}
            >
              Trimestres
            </Button>
          </div>
        </div>
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
                granularity={granularity}
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
