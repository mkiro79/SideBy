/**
 * DatasetTable Component
 * 
 * Tabla para mostrar los datos comparativos de un dataset.
 * Muestra todas las filas con indicador de grupo (_source_group).
 * 
 * Features:
 * - Badge visual para identificar grupos (A vs B)
 * - Columnas dinámicas basadas en schemaMapping
 * - Formateo de valores según tipo de KPI
 * - Accesible y responsive
 * 
 * @see {@link docs/STYLE_GUIDE_SIDEBY.md} - Guía de estilos
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table.tsx';
import type { DataRow, Dataset } from '../types/api.types.js';

// ============================================================================
// TYPES
// ============================================================================

export interface DatasetTableProps {
  /** Dataset completo con datos y configuración */
  dataset: Dataset;
  
  /** Número máximo de filas a mostrar (opcional) */
  maxRows?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formatea un valor según el formato del KPI
 */
function formatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '-';
  
  const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
  
  if (Number.isNaN(numValue)) return String(value);
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
      }).format(numValue);
    
    case 'percentage':
      return `${numValue.toFixed(1)}%`;
    
    case 'number':
      return new Intl.NumberFormat('es-ES').format(numValue);
    
    default:
      return String(value);
  }
}

/**
 * Obtiene columnas visibles del dataset
 */
function getVisibleColumns(dataset: Dataset): string[] {
  const columns: string[] = [];
  
  // Columna de dimensión (si existe)
  if (dataset.schemaMapping?.dimensionField) {
    columns.push(dataset.schemaMapping.dimensionField);
  }
  
  // Columnas de KPIs
  if (dataset.schemaMapping?.kpiFields) {
    dataset.schemaMapping.kpiFields.forEach((kpi) => {
      columns.push(kpi.columnName);
    });
  }
  
  // Columna de fecha (si existe)
  if (dataset.schemaMapping?.dateField) {
    columns.push(dataset.schemaMapping.dateField);
  }
  
  return columns;
}

/**
 * Obtiene el formato de una columna
 */
function getColumnFormat(dataset: Dataset, columnName: string): string | undefined {
  const kpi = dataset.schemaMapping?.kpiFields?.find(
    (k) => k.columnName === columnName
  );
  return kpi?.format;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DatasetTable({ dataset, maxRows }: DatasetTableProps) {
  const columns = getVisibleColumns(dataset);
  const rows = maxRows ? dataset.data.slice(0, maxRows) : dataset.data;
  
  // Labels de los grupos
  const groupALabel = dataset.sourceConfig.groupA.label;
  const groupBLabel = dataset.sourceConfig.groupB.label;
  const groupAColor = dataset.sourceConfig.groupA.color;
  const groupBColor = dataset.sourceConfig.groupB.color;

  /**
   * Retorna el badge del grupo según _source_group
   */
  const getGroupBadge = (row: DataRow) => {
    const isGroupA = row._source_group === 'groupA';
    const label = isGroupA ? groupALabel : groupBLabel;
    const color = isGroupA ? groupAColor : groupBColor;
    
    return (
      <Badge 
        variant="secondary" 
        className="gap-1"
        style={{ 
          borderLeft: `3px solid ${color}`,
        }}
      >
        {label}
      </Badge>
    );
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Datos Comparativos</CardTitle>
        <CardDescription>
          {rows.length} filas de {dataset.data.length} totales
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px]">Grupo</TableHead>
              {columns.map((col) => (
                <TableHead key={col}>
                  {dataset.schemaMapping?.kpiFields?.find((k) => k.columnName === col)?.label || col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {/* Columna de Grupo */}
                <TableCell>{getGroupBadge(row)}</TableCell>

                {/* Columnas de datos */}
                {columns.map((col) => {
                  const format = getColumnFormat(dataset, col);
                  const value = row[col];
                  
                  return (
                    <TableCell key={col}>
                      {formatValue(value, format)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {maxRows && dataset.data.length > maxRows && (
          <div className="border-t p-4 text-center text-sm text-muted-foreground">
            Mostrando {maxRows} de {dataset.data.length} filas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
