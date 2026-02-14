/**
 * ComparisonTable - Tabla de comparación detallada
 * 
 * Muestra datos crudos con expansión opcional
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card.js';
import { Button } from '@/shared/components/ui/button.js';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { DataRow } from '../../types/api.types.js';

interface ComparisonTableProps {
  data: DataRow[];
  kpiFields: Array<{ columnName: string; label?: string; format?: string }>;
  groupALabel: string;
  groupBLabel: string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  data,
  kpiFields,
  groupALabel,
  groupBLabel,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (data.length === 0) {
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

  const displayData = isExpanded ? data : data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tabla Detallada</CardTitle>
          {data.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  Ver {data.length - 10} más
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium">
                  Grupo
                </th>
                {kpiFields.map((field) => (
                  <th
                    key={field.columnName}
                    className="text-right py-2 px-3 text-sm font-medium"
                  >
                    {field.label || field.columnName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 text-sm">
                    {row._source_group === 'groupA' ? groupALabel : groupBLabel}
                  </td>
                  {kpiFields.map((field) => (
                    <td
                      key={field.columnName}
                      className="py-2 px-3 text-sm text-right font-mono"
                    >
                      {row[field.columnName] !== undefined
                        ? Number(row[field.columnName]).toLocaleString()
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
