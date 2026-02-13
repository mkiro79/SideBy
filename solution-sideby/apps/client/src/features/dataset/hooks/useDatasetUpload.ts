/**
 * useDatasetUpload Hook
 *
 * Custom hook para manejar el upload de archivos CSV al backend.
 * Corresponde a la FASE 1 del flujo del wizard (POST /api/v1/datasets).
 *
 * @returns {object} Hook state y funciones
 * @returns {Function} upload - Función para subir archivos
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string | null} error - Mensaje de error (si existe)
 * @returns {Function} reset - Resetear estado
 *
 * @example
 * ```tsx
 * const { upload, isLoading, error } = useDatasetUpload();
 *
 * const handleUpload = async () => {
 *   try {
 *     const result = await upload({ fileA, fileB });
 *     console.log('Dataset ID:', result.datasetId);
 *   } catch (err) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 * ```
 */

import { useState } from "react";
import { uploadFiles } from "../services/datasets.api.js";
import type {
  UploadFilesRequest,
  UploadFilesResponse,
} from "../types/api.types.js";

export function useDatasetUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sube dos archivos CSV al backend para crear un nuevo dataset
   *
   * @param request - Archivos A y B
   * @returns Data del dataset creado (con datasetId)
   * @throws Error si falla el upload
   */
  const upload = async (
    request: UploadFilesRequest,
  ): Promise<UploadFilesResponse["data"]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadFiles(request);
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
    upload,
    isLoading,
    error,
    reset,
  };
}
