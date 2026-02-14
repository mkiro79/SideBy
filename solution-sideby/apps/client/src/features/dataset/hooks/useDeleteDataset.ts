/**
 * useDeleteDataset Hook - Mutation para eliminar datasets
 *
 * Actualiza el cache optimísticamente removiendo el item de la lista
 * antes de la respuesta del servidor para mejor UX.
 *
 * Flujo:
 * 1. onMutate: Remover del cache inmediatamente (optimistic)
 * 2. mutationFn: Enviar DELETE request al backend
 * 3. onSettled: Revalidar queries del servidor
 * 4. onError: Rollback restaurando item si falla
 *
 * Beneficios:
 * - UI responde instantáneamente
 * - Rollback automático en errores
 * - Cache sincronizado post-delete
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDataset } from "../services/datasets.api.js";
import type { ListDatasetsResponse } from "../types/api.types.js";

// ============================================================================
// TYPES
// ============================================================================

interface MutationContext {
  previousDatasets?: ListDatasetsResponse;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para eliminar un dataset con optimistic removal.
 *
 * @returns Mutation object con mutate, mutateAsync, isLoading, error
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteDataset();
 *
 * const handleDelete = async (id: string) => {
 *   if (confirm('¿Eliminar dataset permanentemente?')) {
 *     try {
 *       await deleteMutation.mutateAsync(id);
 *       toast.success('Dataset eliminado');
 *       navigate('/datasets');
 *     } catch (error) {
 *       toast.error('Error al eliminar dataset');
 *     }
 *   }
 * };
 * ```
 */
export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, MutationContext>({
    mutationFn: (datasetId: string) => deleteDataset(datasetId),

    // ⚡ Optimistic Update: Remover de la lista inmediatamente
    onMutate: async (datasetId): Promise<MutationContext> => {
      // Cancelar queries en curso para evitar race condition
      await queryClient.cancelQueries({ queryKey: ["datasets"] });

      // Snapshot del estado anterior (para rollback)
      const previousDatasets = queryClient.getQueryData<ListDatasetsResponse>([
        "datasets",
      ]);

      // Remover del cache optimísticamente
      queryClient.setQueryData<ListDatasetsResponse>(["datasets"], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.filter((dataset) => dataset.id !== datasetId),
          total: old.total - 1,
        };
      });

      // También remover el detalle del cache
      queryClient.removeQueries({ queryKey: ["dataset", datasetId] });

      return { previousDatasets };
    },

    // ❌ Rollback en caso de error
    onError: (_err, _datasetId, context) => {
      if (context?.previousDatasets) {
        queryClient.setQueryData(["datasets"], context.previousDatasets);
      }
    },

    // ✅ Revalidar después de éxito o error (settled)
    onSettled: () => {
      // Invalidar lista para sincronizar con servidor
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}
