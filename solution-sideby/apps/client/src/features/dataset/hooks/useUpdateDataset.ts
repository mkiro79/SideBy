/**
 * useUpdateDataset Hook - Mutation para actualizar configuración de datasets
 *
 * Actualiza la configuración de mapping después del upload de archivos.
 * Invalida automáticamente el cache para refrescar los datos.
 *
 * Flujo:
 * 1. mutationFn: Envía configuración al backend
 * 2. onSuccess: Invalida cache para refetch automático
 * 3. onError: Manejo de errores con toast
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDataset } from "../services/datasets.api.js";
import type { Dataset, UpdateMappingRequest } from "../types/api.types.js";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateDatasetParams {
  id: string;
  payload: UpdateMappingRequest;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para actualizar la configuración de mapping de un dataset.
 *
 * @returns Mutation object con mutate, mutateAsync, isPending, error, data
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateDataset();
 *
 * const handleFinish = async (config: UpdateMappingRequest) => {
 *   try {
 *     await updateMutation.mutateAsync({
 *       id: datasetId,
 *       payload: config,
 *     });
 *
 *     toast.success('Dataset configurado correctamente');
 *     navigate('/datasets');
 *   } catch (error) {
 *     toast.error('Error al guardar configuración');
 *   }
 * };
 * ```
 */
export function useUpdateDataset() {
  const queryClient = useQueryClient();

  return useMutation<Dataset, Error, UpdateDatasetParams>({
    mutationFn: ({ id, payload }: UpdateDatasetParams) =>
      updateDataset(id, payload),

    // ✅ Invalidar cache después de éxito
    onSuccess: (_data, { id }) => {
      // Invalidar el detalle específico para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["dataset", id] });
      // Invalidar la lista para reflejar cambios de estado (processing → ready)
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },

    // ❌ Manejo de errores (el componente debe mostrar el error)
    onError: (error) => {
      console.error("Error updating dataset:", error);
    },
  });
}
