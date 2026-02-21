/**
 * DatasetSummarySection - Resumen visual de los archivos del dataset unificado
 *
 * Muestra las fichas de Archivo A (Actual) y Archivo B (Comparativo)
 * con nombre de archivo, filas y columnas. Es solo de lectura.
 */

import { FileSpreadsheet, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card.js";
import type { Dataset } from "../../types/api.types.js";

// ============================================================================
// PROPS
// ============================================================================

interface DatasetSummarySectionProps {
  dataset: Dataset;
  /** Número total de columnas de datos (excluye _source_group) */
  columnCount: number;
}

// ============================================================================
// SUBCOMPONENT - Tarjeta de archivo individual
// ============================================================================

interface FileCardProps {
  label: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  color: string;
}

const FileCard = ({ label, fileName, rowCount, columnCount, color }: FileCardProps) => (
  <div
    className="flex items-center gap-4 rounded-lg border bg-card p-4 flex-1"
    style={{ borderLeftColor: color, borderLeftWidth: 4 }}
  >
    {/* Icono */}
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}15` }}
    >
      <FileSpreadsheet className="h-6 w-6" style={{ color }} />
    </div>

    {/* Info */}
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold truncate">{fileName}</p>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
          {rowCount.toLocaleString()} filas
        </span>
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
          {columnCount} columnas
        </span>
      </div>
    </div>
  </div>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const DatasetSummarySection = ({
  dataset,
  columnCount,
}: DatasetSummarySectionProps) => {
  const { sourceConfig } = dataset;
  if (!sourceConfig) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <CardTitle>Resumen del Dataset Unificado</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Vista previa de la configuración y datos combinados
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <FileCard
            label="Archivo A (Actual)"
            fileName={sourceConfig.groupA.originalFileName}
            rowCount={sourceConfig.groupA.rowCount}
            columnCount={columnCount}
            color={sourceConfig.groupA.color}
          />
          <FileCard
            label="Archivo B (Comparativo)"
            fileName={sourceConfig.groupB.originalFileName}
            rowCount={sourceConfig.groupB.rowCount}
            columnCount={columnCount}
            color={sourceConfig.groupB.color}
          />
        </div>
      </CardContent>
    </Card>
  );
};
