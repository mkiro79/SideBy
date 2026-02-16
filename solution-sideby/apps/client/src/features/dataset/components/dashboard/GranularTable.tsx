/**
 * GranularTable - Tabla detallada con dimensiones, KPIs y deltas
 * 
 * Muestra datos desglosados por dimensiones con:
 * - Búsqueda/filtrado
 * - Ordenamiento por columnas
 * - Expansión de filas
 * - Export CSV
 * - Cálculo de deltas (absoluto y porcentual)
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table.js';
import { Input } from '@/shared/components/ui/Input.js';
import { Button } from '@/shared/components/ui/button.js';
import { ChevronRight, ChevronDown, Download } from 'lucide-react';
import type { DataRow } from '../../types/api.types.js';
import type { KPIField, KPIFormat } from '../../types/wizard.types.js';

interface GranularTableProps {
  /** Array de datos crudos */
  data: DataRow[];
  
  /** Nombres de las columnas que son dimensiones (ej: ['product', 'region']) */
  dimensions: string[];
  
  /** Definiciones de KPIs */
  kpis: KPIField[];
  
  /** Label del grupo A (ej: "2023") */
  groupALabel: string;
  
  /** Label del grupo B (ej: "2024") */
  groupBLabel: string;
}

interface GranularRow {
  /** Valores de las dimensiones (ej: { product: 'Balón', region: 'Norte' }) */
  dimensionValues: Record<string, string>;
  
  /** Valores de los KPIs con deltas calculados */
  kpiValues: Record<string, {
    groupA: number;
    groupB: number;
    deltaAbs: number;
    deltaPercent: number;
  }>;
}

/**
 * Formatea un valor según su tipo
 */
function formatValue(value: number, format?: KPIFormat): string {
  if (isNaN(value) || !isFinite(value)) {
    return '—';
  }

  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'date':
    case 'string':
      return value.toString();
    
    case 'number':
    default:
      return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}

/**
 * Procesa datos crudos para agrupar por dimensiones y calcular KPIs
 */
function processGranularData(
  data: DataRow[],
  dimensions: string[],
  kpis: KPIField[]
): GranularRow[] {
  if (!data || data.length === 0) {
    return [];
  }

  // Agrupar datos por combinación de dimensiones
  const groups = new Map<string, { groupA: DataRow[], groupB: DataRow[] }>();

  data.forEach((row) => {
    // Construir key única por dimensión
    const dimensionKey = dimensions.map((dim) => row[dim] || 'N/A').join('|');
    
    if (!groups.has(dimensionKey)) {
      groups.set(dimensionKey, { groupA: [], groupB: [] });
    }

    const group = groups.get(dimensionKey)!;
    if (row._source_group === 'groupA') {
      group.groupA.push(row);
    } else {
      group.groupB.push(row);
    }
  });

  // Calcular KPIs para cada grupo
  const granularRows: GranularRow[] = [];

  groups.forEach((groupData) => {
    const dimensionValues: Record<string, string> = {};
    
    // Extraer valores de dimensiones desde el primer row
    const sampleRow = groupData.groupA[0] || groupData.groupB[0];
    dimensions.forEach((dim) => {
      const value = sampleRow?.[dim];
      dimensionValues[dim] = value != null ? String(value) : 'N/A';
    });

    // Calcular KPIs
    const kpiValues: Record<string, {
      groupA: number;
      groupB: number;
      deltaAbs: number;
      deltaPercent: number;
    }> = {};

    kpis.forEach((kpi) => {
      // Agregar valores según tipo de agregación
      let groupAValue = 0;
      let groupBValue = 0;

      if (kpi.aggregation === 'sum') {
        groupAValue = groupData.groupA.reduce((sum, row) => sum + (Number(row[kpi.sourceColumn]) || 0), 0);
        groupBValue = groupData.groupB.reduce((sum, row) => sum + (Number(row[kpi.sourceColumn]) || 0), 0);
      } else if (kpi.aggregation === 'avg') {
        const sumA = groupData.groupA.reduce((sum, row) => sum + (Number(row[kpi.sourceColumn]) || 0), 0);
        const sumB = groupData.groupB.reduce((sum, row) => sum + (Number(row[kpi.sourceColumn]) || 0), 0);
        groupAValue = groupData.groupA.length > 0 ? sumA / groupData.groupA.length : 0;
        groupBValue = groupData.groupB.length > 0 ? sumB / groupData.groupB.length : 0;
      }

      // Calcular deltas
      const deltaAbs = groupBValue - groupAValue;
      const deltaPercent = groupAValue !== 0 ? (deltaAbs / groupAValue) * 100 : 0;

      kpiValues[kpi.id] = {
        groupA: groupAValue,
        groupB: groupBValue,
        deltaAbs,
        deltaPercent: isFinite(deltaPercent) ? deltaPercent : 0,
      };
    });

    granularRows.push({
      dimensionValues,
      kpiValues,
    });
  });

  return granularRows;
}

/**
 * Genera un key único para una fila basado en sus dimensiones
 */
function generateRowKey(dimensionValues: Record<string, string>): string {
  return Object.values(dimensionValues).join('|');
}

/**
 * Exporta datos a CSV
 */
function exportToCSV(
  rows: GranularRow[],
  dimensions: string[],
  kpis: KPIField[],
  groupALabel: string,
  groupBLabel: string
) {
  // Construir headers
  const headers = [
    ...dimensions,
    ...kpis.flatMap((kpi) => [
      `${kpi.label} (${groupALabel})`,
      `${kpi.label} (${groupBLabel})`,
      `Δ ${kpi.label} (Abs)`,
      `Δ ${kpi.label} (%)`,
    ]),
  ];

  // Construir filas
  const csvRows = rows.map((row) => {
    const dimensionCells = dimensions.map((dim) => row.dimensionValues[dim]);
    const kpiCells = kpis.flatMap((kpi) => {
      const kpiData = row.kpiValues[kpi.id];
      return [
        kpiData.groupA.toString(),
        kpiData.groupB.toString(),
        kpiData.deltaAbs.toString(),
        kpiData.deltaPercent.toFixed(1),
      ];
    });
    return [...dimensionCells, ...kpiCells];
  });

  // Generar CSV string
  const csvContent = [
    headers.join(','),
    ...csvRows.map((row) => row.join(',')),
  ].join('\n');

  // Descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `granular-data-${Date.now()}.csv`);
  link.click();
}

export function GranularTable({
  data,
  dimensions,
  kpis,
  groupALabel,
  groupBLabel,
}: GranularTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Procesar datos en estructura granular
  const granularRows = React.useMemo(() => {
    return processGranularData(data, dimensions, kpis);
  }, [data, dimensions, kpis]);

  // Filtrar por búsqueda
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return granularRows;
    
    // Normalizar texto para comparación case-insensitive y sin tildes
    const normalizeText = (text: string) => 
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    
    const normalizedSearch = normalizeText(searchTerm);
    
    return granularRows.filter((row) =>
      Object.values(row.dimensionValues).some((val) =>
        normalizeText(val).includes(normalizedSearch)
      )
    );
  }, [granularRows, searchTerm]);

  // Ordenar
  const sortedRows = React.useMemo(() => {
    if (!sortColumn) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      // Ordenar por dimensión
      if (dimensions.includes(sortColumn)) {
        aVal = a.dimensionValues[sortColumn] || '';
        bVal = b.dimensionValues[sortColumn] || '';
      }
      // Ordenar por KPI
      else {
        const kpi = kpis.find((k) => k.id === sortColumn);
        if (kpi) {
          aVal = a.kpiValues[kpi.id]?.groupB || 0;
          bVal = b.kpiValues[kpi.id]?.groupB || 0;
        }
      }

      // Comparar strings o números
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });
  }, [filteredRows, sortColumn, sortDirection, dimensions, kpis]);

  /**
   * Maneja el click en un header para ordenar
   */
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  /**
   * Alterna la expansión de una fila
   */
  const toggleRowExpansion = (rowKey: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  };

  /**
   * Exporta datos a CSV
   */
  const handleExportCSV = () => {
    exportToCSV(sortedRows, dimensions, kpis, groupALabel, groupBLabel);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">📋 Detalle por Dimensiones</h3>

          <div className="flex items-center gap-2">
            {/* Search */}
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />

            {/* Export CSV */}
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                {/* Dimension headers */}
                {dimensions.map((dim) => (
                  <TableHead
                    key={dim}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort(dim)}
                  >
                    {dim} {sortColumn === dim && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                ))}
                {/* KPI headers */}
                {kpis.map((kpi) => (
                  <React.Fragment key={kpi.id}>
                    <TableHead className="text-right text-xs">{kpi.label} A/B</TableHead>
                    <TableHead className="text-right">Δ {kpi.label}</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2 + dimensions.length + (kpis.length * 2)} className="text-center py-8 text-muted-foreground">
                    No hay datos para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row) => {
                  const rowKey = generateRowKey(row.dimensionValues);
                  const isExpanded = expandedRows.has(rowKey);

                  return (
                    <React.Fragment key={rowKey}>
                      <TableRow
                        className={isExpanded ? 'bg-muted/50' : ''}
                        data-testid="data-row"
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRowExpansion(rowKey)}
                            data-testid="expand-button"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>

                        {/* Dimensiones */}
                        {dimensions.map((dim) => (
                          <TableCell key={dim} className="font-medium">
                            {row.dimensionValues[dim]}
                          </TableCell>
                        ))}

                        {/* KPIs */}
                        {kpis.map((kpi) => {
                          const kpiData = row.kpiValues[kpi.id];
                          const isPositive = kpiData.deltaPercent > 0;

                          return (
                            <React.Fragment key={kpi.id}>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {formatValue(kpiData.groupA, kpi.format)} →{' '}
                                {formatValue(kpiData.groupB, kpi.format)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                                  {isPositive ? '+' : ''}
                                  {formatValue(kpiData.deltaAbs, kpi.format)} ({kpiData.deltaPercent.toFixed(1)}%)
                                </span>
                              </TableCell>
                            </React.Fragment>
                          );
                        })}
                      </TableRow>

                      {/* Expanded Row Content */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell
                            colSpan={2 + dimensions.length + (kpis.length * 2)}
                            className="bg-muted/30 p-4"
                          >
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">📊 Desglose Detallado</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {kpis.map((kpi) => {
                                  const kpiData = row.kpiValues[kpi.id];
                                  return (
                                    <div key={kpi.id} className="space-y-1">
                                      <p className="font-medium">{kpi.label}</p>
                                      <p className="text-muted-foreground">
                                        {groupALabel}: {formatValue(kpiData.groupA, kpi.format)}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {groupBLabel}: {formatValue(kpiData.groupB, kpi.format)}
                                      </p>
                                      <p className={kpiData.deltaPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                                        Delta: {kpiData.deltaPercent > 0 ? '+' : ''}
                                        {formatValue(kpiData.deltaAbs, kpi.format)} ({kpiData.deltaPercent.toFixed(1)}%)
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
