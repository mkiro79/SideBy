/**
 * ConfigurableChart - Gráfico configurable con selector de KPI y Dimensión
 * 
 * Permite al usuario seleccionar:
 * - Qué KPI visualizar
 * - Por qué dimensión (temporal o categórica)
 * 
 * Renderiza dinámicamente:
 * - TrendChart si dimensión es temporal (dateField)
 * - CategoryChart si dimensión es categórica
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import { TrendChart } from './TrendChart.js';
import { CategoryChart } from './CategoryChart.js';
import type { KPIResult } from '../../types/dashboard.types.js';
import type { DataRow } from '../../types/api.types.js';

interface ConfigurableChartProps {
  /** Array de datos filtrados */
  data: DataRow[];
  
  /** KPIs disponibles */
  kpis: KPIResult[];
  
  /** Campo de fecha (opcional - si existe, permite análisis temporal) */
  dateField?: string;
  
  /** Dimensiones categóricas disponibles */
  dimensions: string[];
  
  /** Labels de grupos */
  groupALabel: string;
  groupBLabel: string;
  
  /** Colores de grupos */
  groupAColor: string;
  groupBColor: string;
}

export const ConfigurableChart: React.FC<ConfigurableChartProps> = ({
  data,
  kpis,
  dateField,
  dimensions,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  // Construir lista completa de dimensiones (temporal + categóricas)
  const allDimensions = [
    ...(dateField ? [dateField] : []),
    ...dimensions,
  ];
  
  // Estado para dimensión seleccionada (por defecto: temporal si existe, sino primera categórica)
  const [selectedDimension, setSelectedDimension] = useState<string>(
    allDimensions[0] || ''
  );
  
  // Estado para KPI seleccionado
  const [selectedKpiName, setSelectedKpiName] = useState<string>(
    kpis[0]?.name || ''
  );
  
  // Determinar si la dimensión seleccionada es temporal
  const isTemporalDimension = dateField && selectedDimension === dateField;
  
  // Caso: sin dimensiones disponibles
  if (allDimensions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análisis Configurable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            No hay dimensiones disponibles para analizar
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <CardTitle className="text-lg">Análisis Configurable</CardTitle>
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Selector de KPI */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mostrar KPI:</span>
              <Select value={selectedKpiName} onValueChange={setSelectedKpiName}>
                <SelectTrigger className="w-[180px] h-9">
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
            
            {/* Selector de Dimensión */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Por Dimensión:</span>
              <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateField && (
                    <SelectItem value={dateField}>
                      📅 {dateField.charAt(0).toUpperCase() + dateField.slice(1)} (Temporal)
                    </SelectItem>
                  )}
                  {dimensions.map((dim) => (
                    <SelectItem key={dim} value={dim}>
                      📂 {dim.charAt(0).toUpperCase() + dim.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isTemporalDimension ? (
          /* Renderizar TrendChart para análisis temporal */
          <TrendChart
            data={data}
            dateField={dateField}
            kpis={kpis}
            groupALabel={groupALabel}
            groupBLabel={groupBLabel}
            groupAColor={groupAColor}
            groupBColor={groupBColor}
          />
        ) : (
          /* Renderizar CategoryChart para análisis categórico */
          <CategoryChart
            data={data}
            kpis={kpis}
            dimensions={dimensions}
            groupALabel={groupALabel}
            groupBLabel={groupBLabel}
            groupAColor={groupAColor}
            groupBColor={groupBColor}
          />
        )}
      </CardContent>
    </Card>
  );
};
