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

import { useMutation } from "@tanstack/react-query";
import { uploadFiles } from "../services/datasets.api.js";
import type {
  UploadFilesRequest,
  UploadFilesResponse,
} from "../types/api.types.js";

export function useDatasetUpload() {
  const mutation = useMutation({
    mutationFn: (request: UploadFilesRequest) => uploadFiles(request),
  });

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
    const response = await mutation.mutateAsync(request);
    return response.data;
  };

  return {
    upload,
    isLoading: mutation.isPending,
    error: mutation.error
      ? ((mutation.error as Error).message ?? "Error desconocido")
      : null,
    reset: mutation.reset,
  };
}
