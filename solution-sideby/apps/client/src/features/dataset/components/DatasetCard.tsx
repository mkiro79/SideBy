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
 */

import { Card, CardContent } from "@/shared/components/ui/card.js";
import { Button } from "@/shared/components/ui/button.js";
import { Badge } from "@/shared/components/ui/badge.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog.js";
import { FileSpreadsheet, Calendar, BarChart3, Trash2 } from "lucide-react";
import type { Dataset } from "../types/dataset.types.js";

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface DatasetCardProps {
  dataset: Dataset;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DatasetCard = ({ dataset, onOpen, onDelete }: DatasetCardProps) => {
  const formattedDate = new Date(dataset.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
              {/* Título y descripción */}
              <h3 className="font-medium leading-tight">
                {dataset.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {dataset.description}
              </p>

              {/* Metadata: Archivos y fecha */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Archivos comparados */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span className="text-data-primary">
                    {dataset.fileA}
                  </span>
                  <span>vs</span>
                  <span className="text-data-comparative">
                    {dataset.fileB}
                  </span>
                </div>

                {/* Fecha de creación */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </div>
              </div>

              {/* KPIs y row count */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {dataset.kpis.map((kpi) => (
                  <Badge
                    key={kpi}
                    variant="secondary"
                    className="text-xs"
                  >
                    {kpi}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  {dataset.rowCount.toLocaleString()} filas
                </Badge>
              </div>
            </div>
          </button>

          {/* Botón de eliminar con confirmación */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Eliminar dataset?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará
                  permanentemente el dataset "{dataset.name}" y
                  todos sus datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(dataset.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
