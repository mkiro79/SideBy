/**
 * useUpdateDataset Hook - Mutation para actualizar datasets
 *
 * Implementa optimistic updates para feedback inmediato en la UI.
 * Invalida automáticamente el cache de la lista y del detalle.
 *
 * Flujo:
 * 1. onMutate: Actualiza UI inmediatamente (optimistic)
 * 2. mutationFn: Envía request al backend
 * 3. onSuccess: Revalida queries del servidor
 * 4. onError: Rollback a estado anterior si falla
 *
 * Beneficios:
 * - UI responde instantáneamente (mejor UX)
 * - Rollback automático en errores
 * - Cache sincronizado con servidor
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDataset } from "../services/datasets.api.js";
import type { Dataset } from "../types/api.types.js";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tipo para updates parciales profundos de Dataset
 * Permite actualizar objetos anidados sin necesidad de todos los campos
 */
type DatasetUpdatePayload = {
  meta?: Partial<Dataset["meta"]>;
  sourceConfig?: {
    groupA?: Partial<Dataset["sourceConfig"]["groupA"]>;
    groupB?: Partial<Dataset["sourceConfig"]["groupB"]>;
  };
  schemaMapping?: Partial<Dataset["schemaMapping"]>;
  dashboardLayout?: Partial<Dataset["dashboardLayout"]>;
  status?: Dataset["status"];
};

interface UpdateDatasetParams {
  id: string;
  payload: DatasetUpdatePayload;
}

interface MutationContext {
  previousDataset?: Dataset;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para actualizar metadatos de un dataset con optimistic updates.
 *
 * @returns Mutation object con mutate, mutateAsync, isLoading, error, data
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateDataset();
 *
 * const handleSave = async (formData) => {
 *   try {
 *     await updateMutation.mutateAsync({
 *       id: datasetId,
 *       payload: {
 *         meta: { name: formData.name, description: formData.description },
 *         sourceConfig: {
 *           groupA: { label: formData.labelA, color: formData.colorA },
 *           groupB: { label: formData.labelB, color: formData.colorB },
 *         },
 *       },
 *     });
 *
 *     toast.success('Dataset actualizado correctamente');
 *   } catch (error) {
 *     toast.error('Error al actualizar dataset');
 *   }
 * };
 * ```
 */
export function useUpdateDataset() {
  const queryClient = useQueryClient();

  return useMutation<Dataset, Error, UpdateDatasetParams, MutationContext>({
    mutationFn: ({ id, payload }: UpdateDatasetParams) =>
      updateDataset(id, payload as Partial<Dataset>),

    // ⚡ Optimistic Update: Actualizar UI inmediatamente
    onMutate: async ({ id, payload }): Promise<MutationContext> => {
      // Cancelar queries en curso para evitar race condition
      await queryClient.cancelQueries({ queryKey: ["dataset", id] });

      // Snapshot del estado anterior (para rollback)
      const previousDataset = queryClient.getQueryData<Dataset>([
        "dataset",
        id,
      ]);

      // Actualizar cache optimísticamente
      queryClient.setQueryData<Dataset>(["dataset", id], (old) => {
        if (!old) return old;

        // Garantizar que los campos requeridos se mantengan
        const updated: Dataset = {
          ...old,
          // Merge profundo de objetos anidados
          meta: {
            ...old.meta,
            ...(payload.meta || {}),
          },
          sourceConfig: payload.sourceConfig
            ? {
                groupA: {
                  ...old.sourceConfig?.groupA,
                  ...(payload.sourceConfig.groupA || {}),
                },
                groupB: {
                  ...old.sourceConfig?.groupB,
                  ...(payload.sourceConfig.groupB || {}),
                },
              }
            : old.sourceConfig,
          schemaMapping: payload.schemaMapping
            ? {
                ...old.schemaMapping,
                ...payload.schemaMapping,
                // dimensionField y kpiFields son requeridos, preservar del original
                dimensionField:
                  payload.schemaMapping.dimensionField ??
                  old.schemaMapping?.dimensionField ??
                  "",
                kpiFields:
                  payload.schemaMapping.kpiFields ??
                  old.schemaMapping?.kpiFields ??
                  [],
              }
            : old.schemaMapping,
          dashboardLayout: payload.dashboardLayout
            ? {
                ...old.dashboardLayout,
                ...payload.dashboardLayout,
                // templateId y highlightedKpis son requeridos, preservar del original
                templateId:
                  payload.dashboardLayout.templateId ??
                  old.dashboardLayout?.templateId ??
                  "",
                highlightedKpis:
                  payload.dashboardLayout.highlightedKpis ??
                  old.dashboardLayout?.highlightedKpis ??
                  [],
              }
            : old.dashboardLayout,
          status: payload.status ?? old.status,
        };

        return updated;
      });

      return { previousDataset };
    },

    // ❌ Rollback en caso de error
    onError: (_err, { id }, context) => {
      if (context?.previousDataset) {
        queryClient.setQueryData(["dataset", id], context.previousDataset);
      }
    },

    // ✅ Revalidar después de éxito
    onSuccess: (_, { id }) => {
      // Invalidar el detalle específico
      queryClient.invalidateQueries({ queryKey: ["dataset", id] });
      // Invalidar la lista para reflejar cambios de nombre/meta
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}
