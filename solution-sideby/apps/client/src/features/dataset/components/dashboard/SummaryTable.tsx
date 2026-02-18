/**
 * SummaryTable - Tabla de resumen con totales de KPIs
 * 
 * Tabla sticky que muestra totales globales de todos los KPIs con deltas.
 * Diseñada para estar fija en la parte superior de la vista Detailed.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table.js';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { KPIResult } from '../../types/dashboard.types.js';
import { formatKpiValue } from '../../utils/numberFormat.js';


interface SummaryTableProps {
  /** Array de KPIs calculados */
  kpis: KPIResult[];
  
  /** Label del grupo A (ej: "2024") */
  groupALabel: string;

  /** Color del grupo A */
  groupAColor?: string;
  
  /** Label del grupo B (ej: "2023") */
  groupBLabel: string;

  /** Color del grupo B */
  groupBColor?: string;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  kpis,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
}) => {
  const formatValue = (value: number, format: KPIResult["format"]): string =>
    formatKpiValue(value, format, { compact: true });

  const resolvedGroupAColor = groupAColor ?? 'hsl(var(--primary))';
  const resolvedGroupBColor = groupBColor ?? 'hsl(var(--secondary))';

  return (
    <Card className="sticky top-20 z-10 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">📊 Resumen General (Totales)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">KPI</TableHead>
              <TableHead className="text-right font-semibold">
                <span style={{ color: resolvedGroupAColor }}>{groupALabel}</span>
              </TableHead>
              <TableHead className="text-right font-semibold">
                <span style={{ color: resolvedGroupBColor }}>{groupBLabel}</span>
              </TableHead>
              <TableHead className="text-right font-semibold">Delta Abs</TableHead>
              <TableHead className="text-right font-semibold">Delta %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay KPIs para mostrar
                </TableCell>
              </TableRow>
            ) : (
              kpis.map((kpi) => {
                const deltaAbs = kpi.diff;
                const deltaPercent = kpi.diffPercent;
                const isPositive = deltaPercent > 0;
                const isInfinite = !Number.isFinite(deltaPercent);

                return (
                  <TableRow key={kpi.name}>
                    {/* KPI Label */}
                    <TableCell className="font-medium">{kpi.label}</TableCell>

                    {/* Valor Grupo A */}
                    <TableCell className="text-right tabular-nums">
                      {formatValue(kpi.valueA, kpi.format)}
                    </TableCell>

                    {/* Valor Grupo B */}
                    <TableCell className="text-right tabular-nums">
                      {formatValue(kpi.valueB, kpi.format)}
                    </TableCell>

                    {/* Delta Absoluto */}
                    <TableCell className="text-right tabular-nums">
                      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                        {deltaAbs > 0 ? '+' : ''}
                        {formatValue(deltaAbs, kpi.format)}
                      </span>
                    </TableCell>

                    {/* Delta Porcentual con Icono */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isInfinite ? (
                          <span className="text-muted-foreground">N/A</span>
                        ) : (
                          <>
                            <span
                              className={`font-medium tabular-nums ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {deltaPercent > 0 ? '+' : ''}
                              {deltaPercent.toFixed(1)}%
                            </span>
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
