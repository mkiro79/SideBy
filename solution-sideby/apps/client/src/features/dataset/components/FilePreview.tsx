/**
 * FilePreview Component
 * 
 * Componente reutilizable para mostrar vista previa de archivos CSV
 * con tabla de datos y metadata del archivo.
 * Usado en ColumnMappingStep para mostrar ambos archivos lado a lado.
 */

import { FileText } from 'lucide-react';
import { Card } from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface FilePreviewProps {
  /**
   * Nombre del archivo
   */
  readonly fileName: string;

  /**
   * Label descriptivo (ej: "Archivo A", "Grupo A")
   */
  readonly label: string;

  /**
   * Variante de color para diferenciación visual
   */
  readonly variant: 'primary' | 'comparative';

  /**
   * Headers de las columnas
   */
  readonly headers: string[];

  /**
   * Filas de datos (primeras N filas para preview)
   * Puede ser array de arrays o array de objetos
   */
  readonly rows: Array<Record<string, unknown>> | Array<Array<string | number>>;

  /**
   * Número total de filas en el archivo (opcional)
   */
  readonly totalRows?: number;

  /**
   * Tamaño del archivo (opcional)
   */
  readonly fileSize?: string;

  /**
   * Clase adicional para el contenedor
   */
  readonly className?: string;
}

/**
 * Formatea un valor de celda para mostrar
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilePreview({
  fileName,
  label,
  variant,
  headers,
  rows,
  totalRows,
  fileSize,
  className,
}: FilePreviewProps) {
  const colors = {
    primary: {
      border: 'border-l-data-primary',
      bg: 'bg-data-primary',
      bgLight: 'bg-data-primary/10',
      text: 'text-data-primary',
      badge: 'bg-data-primary/10 text-data-primary border-data-primary/30',
    },
    comparative: {
      border: 'border-l-data-comparative',
      bg: 'bg-data-comparative',
      bgLight: 'bg-data-comparative/10',
      text: 'text-data-comparative',
      badge: 'bg-data-comparative/10 text-data-comparative border-data-comparative/30',
    },
  };

  const colorScheme = colors[variant];

  // Convertir rows a formato uniforme (array de objetos)
  const normalizedRows = rows.map((row) => {
    if (Array.isArray(row)) {
      // Convertir array a objeto usando headers
      return headers.reduce(
        (obj, header, index) => {
          obj[header] = row[index];
          return obj;
        },
        {} as Record<string, unknown>
      );
    }
    return row;
  });

  return (
    <Card className={cn('overflow-hidden border-l-4', colorScheme.border, className)}>
      {/* Header con metadata */}
      <div className={cn('px-4 py-3 border-b', colorScheme.bgLight)}>
        <div className="flex items-center gap-3">
          <div className={cn('flex-shrink-0 p-2 rounded-lg', colorScheme.bgLight)}>
            <FileText className={cn('w-5 h-5', colorScheme.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={colorScheme.badge}>
                {label}
              </Badge>
            </div>
            <p className="text-sm font-medium truncate mt-1">{fileName}</p>
          </div>

          {(totalRows || fileSize) && (
            <div className="flex flex-col gap-1 text-right">
              {totalRows && (
                <Badge variant="secondary" className="text-xs">
                  {totalRows.toLocaleString()} filas
                </Badge>
              )}
              {fileSize && (
                <span className="text-xs text-muted-foreground">{fileSize}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de datos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Headers */}
          <thead className="bg-muted/50 border-b">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y">
            {normalizedRows.map((row, rowIndex) => {
              const rowKey = typeof row === 'object' && row !== null 
                ? `row-${JSON.stringify(Object.values(row).slice(0, 2))}-${rowIndex}`
                : `row-${rowIndex}`;
              return (
                <tr
                  key={rowKey}
                  className="hover:bg-accent/5 transition-colors"
                >
                  {headers.map((header) => {
                    const cellValue = row[header];
                    const cellKey = `${header}-${String(cellValue)}-${rowIndex}`;
                    const displayValue = formatCellValue(cellValue);
                    return (
                      <td
                        key={cellKey}
                        className="px-3 py-2.5 whitespace-nowrap"
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con indicador de preview */}
      {totalRows && totalRows > rows.length && (
        <div className="px-4 py-2 bg-muted/30 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Mostrando {rows.length} de {totalRows.toLocaleString()} filas
          </p>
        </div>
      )}
    </Card>
  );
}
