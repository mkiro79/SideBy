/**
 * useDatasetMapping Hook
 *
 * Custom hook para actualizar la configuración de mapping de un dataset.
 * Corresponde a la FASE 2 del flujo del wizard (PATCH /api/v1/datasets/:id).
 *
 * @returns {object} Hook state y funciones
 * @returns {Function} update - Función para actualizar mapping
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string | null} error - Mensaje de error (si existe)
 * @returns {Function} reset - Resetear estado
 *
 * @example
 * ```tsx
 * const { update, isLoading, error } = useDatasetMapping();
 *
 * const handleUpdate = async () => {
 *   try {
 *     const result = await update(datasetId, mappingConfig);
 *     console.log('Dataset status:', result.status);
 *   } catch (err) {
 *     console.error('Update failed:', error);
 *   }
 * };
 * ```
 */

import { useState } from "react";
import { updateMapping } from "../services/datasets.api.js";
import type {
  UpdateMappingRequest,
  UpdateMappingResponse,
} from "../types/api.types.js";

export function useDatasetMapping() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateMapping(datasetId, request);
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resetea el estado del hook (error y loading)
   */
  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return {
    update,
    isLoading,
    error,
    reset,
  };
}
