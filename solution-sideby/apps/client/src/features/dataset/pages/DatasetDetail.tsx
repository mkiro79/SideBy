/**
 * DatasetDetail Page - Página de edición de dataset (Placeholder)
 * 
 * FASE 6: Esta página se implementará completamente en Phase 6.
 * Por ahora es un placeholder para no romper las rutas.
 * 
 * Funcionalidad futura:
 * - Formulario de edición de metadatos (nombre, descripción)
 * - Edición de configuración de grupos (labels, colores)
 * - Edición de KPI fields (labels, formatos)
 * - Configuración de IA (enabled, contexto)
 * - React Hook Form + Zod validation
 * - Optimistic updates con React Query
 */

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card.js";

const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/datasets')}
            aria-label="Volver a la lista"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Editar Dataset</h1>
            <p className="text-sm text-muted-foreground">ID: {id}</p>
          </div>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>🚧 Página en Construcción - Phase 6</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Esta página se implementará en <strong>Phase 6: DatasetDetail Edit Page</strong>.
            </p>
            
            <div className="rounded-lg border border-dashed p-4 space-y-2">
              <h3 className="font-medium text-sm">Funcionalidades planeadas:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Formulario de edición con React Hook Form</li>
                <li>Validación con Zod</li>
                <li>Actualización con React Query (optimistic updates)</li>
                <li>Edición de metadatos, grupos, KPIs y configuración IA</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => navigate('/datasets')}>
                Volver a la Lista
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/datasets/${id}/dashboard`)}
              >
                Ver Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatasetDetail;
