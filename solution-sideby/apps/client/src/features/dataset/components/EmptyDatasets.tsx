/**
 * EmptyDatasets - Componente de estado vacío
 * 
 * Componente presentacional que se muestra cuando no hay datasets.
 * Proporciona una CTA para crear el primer dataset.
 * 
 * Props:
 * - onCreateNew: Callback al hacer click en crear nuevo dataset
 */

import { Card, CardContent } from "@/shared/components/ui/card.js";
import { Button } from "@/shared/components/ui/button.js";
import { FileSpreadsheet, Plus } from "lucide-react";

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface EmptyDatasetsProps {
  onCreateNew: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EmptyDatasets = ({ onCreateNew }: EmptyDatasetsProps) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        {/* Icono decorativo */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Mensaje */}
        <h3 className="mb-2 font-medium">No tienes datasets</h3>
        <p className="mb-4 text-center text-sm text-muted-foreground max-w-sm">
          Crea tu primer dataset comparativo subiendo dos archivos
        </p>

        {/* CTA Button */}
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Nuevo Dataset
        </Button>
      </CardContent>
    </Card>
  );
};
