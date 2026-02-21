/**
 * DatasetDetail Page - Página de edición de dataset
 * 
 * Funcionalidad:
 * - Formulario de edición de metadatos (nombre, descripción)
 * - Configuración de grupos (labels, colores - DISABLED por limitación backend)
 * - Edición de KPI fields (labels, formatos)
 * - Configuración de IA (enabled, contexto)
 * - React Hook Form + Zod validation
 * - Optimistic updates con React Query
 * 
 * IMPORTANTE: sourceConfig (grupos) NO es editable actualmente porque
 * el backend no lo soporta en el endpoint PATCH.
 * Ver: docs/ROADMAP.md → RFC-004 → Backend: Soportar edición de sourceConfig
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

import { SidebarProvider } from "@/shared/components/ui/sidebar.js";
import { AppSidebar } from "@/shared/components/AppSidebar.js";
import { Button } from "@/shared/components/ui/button.js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog.js";
import { toast } from "@/shared/services/toast.js";

import { useDataset } from "../hooks/useDataset.js";
import { useUpdateDataset } from "../hooks/useUpdateDataset.js";
import { datasetEditSchema } from "../schemas/datasetEdit.schema.js";
import type { DatasetEditFormData } from "../schemas/datasetEdit.schema.js";
import type { Dataset } from "../types/api.types.js";

import { GeneralInfoFields } from "../components/edit/GeneralInfoFields.js";
import { GroupConfigFields } from "../components/edit/GroupConfigFields.js";
import { KPIFieldsSection } from "../components/edit/KPIFieldsSection.js";
import { AIConfigFields } from "../components/edit/AIConfigFields.js";
import { DatasetSummarySection } from "../components/edit/DatasetSummarySection.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convierte un Dataset a formato de formulario
 * 
 * NOTA: Para datasets creados antes de la feature de highlightedKpis,
 * si el array está vacío, se auto-seleccionan hasta 5 KPIs como conveniencia
 * para evitar que los usuarios tengan que configurarlos manualmente.
 * Si highlightedKpis existe (aunque esté vacío por elección del usuario),
 * se respeta y no se auto-completa.
 */
const datasetToFormData = (dataset: Dataset): Partial<DatasetEditFormData> => {
  // Auto-detectar highlightedKpis solo para datasets legacy (sin dashboardLayout)
  let highlightedKpis = dataset.dashboardLayout?.highlightedKpis || [];
  if (!dataset.dashboardLayout && highlightedKpis.length === 0 && dataset.schemaMapping?.kpiFields) {
    // UI convenience: para datasets legacy, tomar los primeros 4 KPIs como destacados
    highlightedKpis = dataset.schemaMapping.kpiFields
      .slice(0, 4)
      .map((kpi) => kpi.columnName);
  }

  // Auto-detectar categoricalFields si está vacío
  let categoricalFields = dataset.schemaMapping?.categoricalFields || [];
  if (categoricalFields.length === 0 && dataset.data && dataset.data.length > 0) {
    const firstRow = dataset.data[0];
    categoricalFields = Object.keys(firstRow).filter((key) => {
      const value = firstRow[key];
      // Incluir solo strings, excluir campos especiales
      return typeof value === "string" && key !== "_source_group";
    });
  }

  return {
    meta: {
      name: dataset.meta.name,
      description: dataset.meta.description || "",
    },
    sourceConfig: dataset.sourceConfig
      ? {
          groupA: {
            label: dataset.sourceConfig.groupA.label,
            color: dataset.sourceConfig.groupA.color,
          },
          groupB: {
            label: dataset.sourceConfig.groupB.label,
            color: dataset.sourceConfig.groupB.color,
          },
        }
      : undefined,
    schemaMapping: dataset.schemaMapping
      ? {
          dimensionField: dataset.schemaMapping.dimensionField || "",
          dateField: dataset.schemaMapping.dateField || "",
          kpiFields: dataset.schemaMapping.kpiFields || [],
          categoricalFields, // Auto-detectado
        }
      : {
          dimensionField: "",
          dateField: "",
          kpiFields: [],
          categoricalFields, // Auto-detectado
        },
    dashboardLayout: {
      templateId: (dataset.dashboardLayout?.templateId ||
        "sideby_executive") as "sideby_executive",
      highlightedKpis, // Auto-detectado
    },
    aiConfig: {
      enabled: dataset.aiConfig?.enabled || false,
      userContext: dataset.aiConfig?.userContext || "",
    },
  };
};

/**
 * Extrae las columnas disponibles del dataset para los selects
 */
const getAvailableColumns = (dataset: Dataset): string[] => {
  if (!dataset.data || dataset.data.length === 0) return [];
  const firstRow = dataset.data[0];
  return Object.keys(firstRow).filter((key) => key !== "_source_group");
};

// ============================================================================
// COMPONENT
// ============================================================================

const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);

  // React Query hooks
  const { dataset, isLoading, error } = useDataset(id || null);
  const updateMutation = useUpdateDataset();

  // Extrae columnas disponibles
  const availableColumns = useMemo(() => {
    return dataset ? getAvailableColumns(dataset) : [];
  }, [dataset]);

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<DatasetEditFormData>({
    resolver: zodResolver(datasetEditSchema),
    defaultValues: {
      meta: { name: "", description: "" },
      schemaMapping: {
        dimensionField: "",
        dateField: "",
        kpiFields: [],
      },
      dashboardLayout: {
        templateId: "sideby_executive",
        highlightedKpis: [],
      },
      aiConfig: {
        enabled: false,
        userContext: "",
      },
    },
  });

  // Cargar datos en el form cuando el dataset se obtiene
  useEffect(() => {
    if (dataset) {
      const formData = datasetToFormData(dataset);
      reset(formData as DatasetEditFormData);
    }
  }, [dataset, reset]);

  /**
   * Maneja el submit del formulario
   */
  const onSubmit = async (formData: DatasetEditFormData) => {
    if (!id) return;

    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          meta: {
            name: formData.meta.name,
            description: formData.meta.description || undefined,
          },
          sourceConfig: formData.sourceConfig
            ? {
                groupA: {
                  label: formData.sourceConfig.groupA?.label || undefined,
                  color: formData.sourceConfig.groupA?.color || undefined,
                },
                groupB: {
                  label: formData.sourceConfig.groupB?.label || undefined,
                  color: formData.sourceConfig.groupB?.color || undefined,
                },
              }
            : undefined,
          schemaMapping: formData.schemaMapping,
          dashboardLayout: formData.dashboardLayout,
          aiConfig: formData.aiConfig
            ? {
                enabled: formData.aiConfig.enabled,
                userContext: formData.aiConfig.userContext || undefined,
              }
            : undefined,
        },
      });

      toast.success(
        "Dataset actualizado",
        "Los cambios se guardaron correctamente.",
      );

      // Volver a la lista después de guardar
      navigate("/datasets");
    } catch (err) {
      toast.error(
        "Error al guardar",
        err instanceof Error ? err.message : "Error desconocido",
      );
    }
  };

  /**
   * Navega de regreso a la lista.
   * Si hay cambios sin guardar, muestra un AlertDialog de confirmación.
   */
  const handleBack = () => {
    if (isDirty) {
      setIsUnsavedChangesDialogOpen(true);
      return;
    }
    navigate("/datasets");
  };

  /**
   * Confirma la navegación descartando cambios
   */
  const handleConfirmBack = () => {
    setIsUnsavedChangesDialogOpen(false);
    navigate("/datasets");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !dataset) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-destructive">
            Error al cargar dataset
          </h2>
          <p className="text-muted-foreground">
            {error || "No se encontró el dataset"}
          </p>
          <Button onClick={() => navigate("/datasets")}>
            Volver a la Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
      {/* ================================================================
          DIALOG - Confirmar salir con cambios sin guardar
      ================================================================ */}
      <AlertDialog open={isUnsavedChangesDialogOpen} onOpenChange={setIsUnsavedChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, se perderán todos los cambios realizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmBack}
            >
              Salir sin guardar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mx-auto w-full max-w-4xl pt-16 pb-6 md:py-6 space-y-6 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Volver a la lista"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Editar Dataset</h1>
              <p className="text-sm text-muted-foreground">
                {dataset.meta.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Form Sections */}
        {/* Resumen visual de los archivos originales */}
        <DatasetSummarySection
          dataset={dataset}
          columnCount={availableColumns.length}
        />

        <GeneralInfoFields control={control} errors={errors} />

        {/* Configuración de grupos: labels y colores editables */}
        <GroupConfigFields
          control={control}
          errors={errors}
        />

        <KPIFieldsSection
          control={control}
          errors={errors}
          availableColumns={availableColumns}
        />

        <AIConfigFields control={control} errors={errors} />

        {/* Footer Actions (repeat for convenience) */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DatasetDetail;

