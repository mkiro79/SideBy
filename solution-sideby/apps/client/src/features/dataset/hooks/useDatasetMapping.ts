/**
 * useDatasetMapping Hook
 *
 * Custom hook para actualizar la configuración de mapping de un dataset.
 * Corresponde a la FASE 2 del flujo del wizard (PATCH /api/v1/datasets/:id).
 *
 * Ahora usa internamente React Query (useUpdateDataset) para invalidar
 * automáticamente el cache de la lista de datasets.
 *
 * @returns {object} Hook state y funciones
 * @returns {Function} update - Función para actualizar mapping
 * @returns {boolean} isLoading - Estado de carga
 *
 * @example
 * ```tsx
 * const { update, isLoading } = useDatasetMapping();
 *
 * const handleUpdate = async () => {
 *   const result = await update(datasetId, mappingConfig);
 *   console.log('Dataset status:', result.status);
 * };
 * ```
 */

import { useUpdateDataset } from "./useUpdateDataset.js";
import type {
  UpdateMappingRequest,
  UpdateMappingResponse,
} from "../types/api.types.js";

export function useDatasetMapping() {
  const mutation = useUpdateDataset();

  /**
   * Actualiza la configuración de mapping de un dataset
   *
   * @param datasetId - ID del dataset a actualizar
   * @param request - Configuración de mapping y metadata
   * @returns Data del dataset actualizado (status='ready')
   * @throws Error si falla la actualización
   */
  const update = async (
    datasetId: string,
    request: UpdateMappingRequest,
  ): Promise<UpdateMappingResponse["data"]> => {
    const result = await mutation.mutateAsync({
      id: datasetId,
      payload: request,
    });

    // Retornar formato compatible con la interfaz anterior
    // El backend siempre retorna status='ready' después de configurar
    return {
      datasetId: result.id,
      status: "ready" as const,
    };
  };

  return {
    update,
    isLoading: mutation.isPending,
  };
}

