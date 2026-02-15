/**
 * ComparisonTable - Tabla de comparación detallada con Delta
 * 
 * Tabla comparativa con columnas: Métrica | Categoría | Actual | Comparativo | Cambio (%)
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPIResult } from '../../types/dashboard.types.js';

interface ComparisonTableProps {
  kpis: KPIResult[];
  groupALabel: string;
  groupBLabel: string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  kpis,
  groupALabel,
  groupBLabel,
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
        return new Intl.NumberFormat('es-ES').format(value);
      default:
        return String(value);
    }
  };

  const getChangeIndicator = (change: number) => {
    if (!isFinite(change)) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Minus className="h-3 w-3" />
          N/A
        </Badge>
      );
    }
    
    if (Math.abs(change) < 0.1) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Minus className="h-3 w-3" />
          0%
        </Badge>
      );
    }

    const isPositive = change > 0;

    return (
      <Badge variant={isPositive ? 'success' : 'destructive'} className="gap-1">
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? '+' : ''}
        {change.toFixed(1)}%
      </Badge>
    );
  };

  const getCategoryFromName = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('revenue') || nameLower.includes('ventas') || nameLower.includes('ingreso')) {
      return 'Ingresos';
    }
    if (nameLower.includes('ticket') || nameLower.includes('promedio')) {
      return 'Ingresos';
    }
    if (nameLower.includes('lead') || nameLower.includes('conversion') || nameLower.includes('cac')) {
      return 'Marketing';
    }
    if (nameLower.includes('user') || nameLower.includes('cliente') || nameLower.includes('ltv') || nameLower.includes('nps')) {
      return 'Clientes';
    }
    if (nameLower.includes('tiempo') || nameLower.includes('respuesta') || nameLower.includes('soporte')) {
      return 'Soporte';
    }
    return 'General';
  };

  if (kpis.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No hay datos para mostrar con los filtros aplicados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Datos Comparativos Detallados</CardTitle>
        <CardDescription>
          Comparación métrica por métrica entre períodos
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b hover:bg-transparent">
                <th className="text-left py-3 px-4 text-sm font-medium w-[200px]">
                  Métrica
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium">
                  Categoría
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {groupALabel}
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-secondary" />
                    {groupBLabel}
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium">
                  Cambio
                </th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => {
                const category = getCategoryFromName(kpi.name);
                return (
                  <tr key={kpi.name} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium text-sm">
                      {kpi.label}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-normal">
                        {category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-sm">
                      {formatValue(kpi.valueA, kpi.format)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-sm">
                      {formatValue(kpi.valueB, kpi.format)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {getChangeIndicator(kpi.diffPercent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
