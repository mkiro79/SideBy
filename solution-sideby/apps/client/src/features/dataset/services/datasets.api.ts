/**
 * Datasets API Service
 *
 * Cliente HTTP para interactuar con el backend de Datasets.
 * Usa axios con interceptor de autenticación (reutiliza auth.repository.ts).
 *
 * @see {@link ../types/api.types.ts} - Tipos de Request/Response
 */

import axios, { type AxiosInstance, type AxiosError } from "axios";
import type {
  UploadFilesRequest,
  UploadFilesResponse,
  UpdateMappingRequest,
  UpdateMappingResponse,
  Dataset,
  ListDatasetsResponse,
  DeleteDatasetResponse,
  ApiError,
} from "../types/api.types.js";

// ============================================================================
// AXIOS INSTANCE CON CONFIGURACIÓN BASE
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Obtiene el token JWT del localStorage (Zustand persist)
 */
const getAuthToken = (): string | null => {
  const storedAuth = localStorage.getItem("sideby-auth-storage");
  if (!storedAuth) return null;

  try {
    const parsed: unknown = JSON.parse(storedAuth);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "state" in parsed &&
      typeof (parsed as Record<string, unknown>).state === "object" &&
      (parsed as Record<string, unknown>).state !== null
    ) {
      const state = (parsed as Record<string, unknown>).state as Record<
        string,
        unknown
      >;
      const maybeToken = state.token;
      if (typeof maybeToken === "string" && maybeToken.trim() !== "") {
        return maybeToken;
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Instancia de axios configurada para el API de Datasets
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos (uploads pueden tardar)
});

/**
 * Interceptor: Agregar token de autenticación automáticamente
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Extrae mensaje de error de la respuesta del backend
 */
const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const apiError = axiosError.response?.data;

    if (apiError && "error" in apiError) {
      return apiError.error;
    }

    // Fallback para respuestas sin estructura ApiError
    if (axiosError.response?.statusText) {
      return axiosError.response.statusText;
    }

    return axiosError.message || "Error desconocido";
  }

  return error instanceof Error ? error.message : "Error desconocido";
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * POST /api/v1/datasets - Upload de archivos
 *
 * Envía dos archivos CSV para crear un nuevo dataset.
 * El backend los procesa y retorna un datasetId en estado 'processing'.
 *
 * @param request - Archivos A y B
 * @returns Response con datasetId y metadata
 * @throws Error si el upload falla o los archivos son inválidos
 */
export async function uploadFiles(
  request: UploadFilesRequest,
): Promise<UploadFilesResponse> {
  try {
    const formData = new FormData();
    formData.append("fileA", request.fileA);
    formData.append("fileB", request.fileB);

    const response = await apiClient.post<UploadFilesResponse>(
      "/api/v1/datasets",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * PATCH /api/v1/datasets/:id - Actualizar configuración de mapping
 *
 * Envía la configuración de mapping, metadata y layout del dashboard.
 * El backend valida y actualiza el dataset a estado 'ready'.
 *
 * @param datasetId - ID del dataset a actualizar
 * @param request - Configuración de mapping y metadata
 * @returns Response con status 'ready'
 * @throws Error si la actualización falla o la validación es inválida
 */
export async function updateMapping(
  datasetId: string,
  request: UpdateMappingRequest,
): Promise<UpdateMappingResponse> {
  try {
    const response = await apiClient.patch<UpdateMappingResponse>(
      `/api/v1/datasets/${datasetId}`,
      request,
    );

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * GET /api/v1/datasets/:id - Obtener dataset completo
 *
 * Retorna el dataset con toda su información, incluyendo los datos procesados.
 *
 * @param datasetId - ID del dataset
 * @returns Dataset completo con datos
 * @throws Error si el dataset no existe o no pertenece al usuario
 */
export async function getDataset(datasetId: string): Promise<Dataset> {
  try {
    const response = await apiClient.get<{ success: boolean; data: Dataset }>(
      `/api/v1/datasets/${datasetId}`,
    );

    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * PATCH /api/v1/datasets/:id - Actualizar dataset
 *
 * Actualiza los metadatos de un dataset existente (nombre, descripción, configuración).
 * Usado para edición de datasets sin afectar los datos cargados.
 *
 * @param datasetId - ID del dataset a actualizar
 * @param payload - Campos a actualizar (partial)
 * @returns Dataset actualizado completo
 * @throws Error si la actualización falla
 */
export async function updateDataset(
  datasetId: string,
  payload: Partial<Dataset>,
): Promise<Dataset> {
  try {
    const response = await apiClient.patch<{ success: boolean; data: Dataset }>(
      `/api/v1/datasets/${datasetId}`,
      payload,
    );

    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * GET /api/v1/datasets - Listar todos los datasets del usuario
 *
 * Retorna una lista resumida de datasets (sin el campo 'data').
 *
 * @returns Lista de datasets con metadata básica
 * @throws Error si falla la petición
 */
export async function listDatasets(): Promise<ListDatasetsResponse> {
  try {
    const response =
      await apiClient.get<ListDatasetsResponse>("/api/v1/datasets");

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * DELETE /api/v1/datasets/:id - Eliminar dataset
 *
 * Elimina permanentemente un dataset y todos sus datos asociados.
 *
 * @param datasetId - ID del dataset a eliminar
 * @returns void
 * @throws Error si la eliminación falla o el dataset no existe
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  try {
    await apiClient.delete<DeleteDatasetResponse>(
      `/api/v1/datasets/${datasetId}`,
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
