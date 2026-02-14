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

import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button.js";
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convierte un Dataset a formato de formulario
 */
const datasetToFormData = (dataset: Dataset): Partial<DatasetEditFormData> => {
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
    schemaMapping: dataset.schemaMapping || {
      dimensionField: "",
      dateField: "",
      kpiFields: [],
      categoricalFields: [],
    },
    dashboardLayout: {
      templateId: (dataset.dashboardLayout?.templateId ||
        "sideby_executive") as "sideby_executive",
      highlightedKpis: dataset.dashboardLayout?.highlightedKpis || [],
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
      // Construir payload para backend (SIN sourceConfig por limitación)
      await updateMutation.mutateAsync({
        id,
        payload: {
          meta: {
            name: formData.meta.name,
            description: formData.meta.description || undefined,
          },
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
   * Navega de regreso a la lista
   */
  const handleBack = () => {
    if (isDirty) {
      const confirmed = globalThis.confirm(
        "Tienes cambios sin guardar. ¿Estás seguro de salir?",
      );
      if (!confirmed) return;
    }
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
    <div className="min-h-screen bg-background p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="container max-w-4xl space-y-6">
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
        <GeneralInfoFields control={control} errors={errors} />

        <GroupConfigFields
          control={control}
          errors={errors}
          disabled={true} // Disabled por limitación backend
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
  );
};

export default DatasetDetail;

