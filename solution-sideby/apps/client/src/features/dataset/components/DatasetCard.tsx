/**
 * DatasetCard - Componente de tarjeta individual para dataset
 * 
 * Componente presentacional (Dumb) que muestra la información de un dataset.
 * Toda la lógica de negocio se maneja en el componente padre.
 * 
 * Props:
 * - dataset: Datos del dataset a mostrar
 * - onOpen: Callback al hacer click en la tarjeta
 * - onDelete: Callback al eliminar el dataset
 * - isDeleting: Estado de loading durante la eliminación (optimistic update)
 */

import { useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card.js";
import { Button } from "@/shared/components/ui/button.js";
import { Badge } from "@/shared/components/ui/badge.js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog.js";
import { FileSpreadsheet, Calendar, BarChart3, Trash2, Loader2 } from "lucide-react";
import type { DatasetSummary } from "../types/api.types.js";

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface DatasetCardProps {
  dataset: DatasetSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DatasetCard = ({ 
  dataset, 
  onOpen, 
  onDelete,
  isDeleting = false,
}: DatasetCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const formattedDate = new Date(dataset.meta.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Determinar estado visual
  const statusMap = {
    processing: { variant: "secondary" as const, label: "Procesando" },
    ready: { variant: "default" as const, label: "Listo" },
    error: { variant: "destructive" as const, label: "Error" },
  };
  const statusInfo = statusMap[dataset.status] || statusMap.ready;

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    await onDelete(dataset.id);
    setIsDialogOpen(false);
  };

  return (
    <Card className="transition-all hover:shadow-[var(--shadow-soft)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Contenido principal - Clickeable */}
          <button
            type="button"
            className="flex flex-1 cursor-pointer items-start gap-4 text-left"
            onClick={() => onOpen(dataset.id)}
          >
            {/* Icono */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>

            {/* Información del dataset */}
            <div className="flex-1 space-y-1">
              {/* Título y estado */}
              <div className="flex items-center gap-2">
                <h3 className="font-medium leading-tight">
                  {dataset.meta.name}
                </h3>
                <Badge variant={statusInfo.variant} className="text-xs">
                  {statusInfo.label}
                </Badge>
              </div>
              
              {dataset.meta.description && (
                <p className="text-sm text-muted-foreground">
                  {dataset.meta.description}
                </p>
              )}

              {/* Metadata: Archivos y fecha */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Archivos comparados */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span style={{ color: dataset.sourceConfig.groupA.color }}>
                    {dataset.sourceConfig.groupA.label}
                  </span>
                  <span>vs</span>
                  <span style={{ color: dataset.sourceConfig.groupB.color }}>
                    {dataset.sourceConfig.groupB.label}
                  </span>
                </div>

                {/* Fecha de creación */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </div>
              </div>

              {/* Row count */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <Badge variant="outline" className="text-xs">
                  {dataset.totalRows.toLocaleString()} filas
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {dataset.sourceConfig.groupA.rowCount.toLocaleString()} + {dataset.sourceConfig.groupB.rowCount.toLocaleString()}
                </Badge>
              </div>
            </div>
          </button>

          {/* Botón de eliminar con confirmación */}
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={isDeleting}
                aria-label="Eliminar dataset"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Eliminar dataset?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará
                  permanentemente el dataset "{dataset.meta.name}" y
                  todos sus datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <Button
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
