/**
 * Datasets API Service
 *
 * Cliente HTTP para interactuar con el backend de Datasets.
 * Usa axios con interceptor de autenticación (reutiliza auth.repository.ts).
 *
 * @see {@link ../types/api.types.ts} - Tipos de Request/Response
 */

import axios, { type AxiosInstance } from "axios";
import type {
  UploadFilesRequest,
  UploadFilesResponse,
  UpdateMappingRequest,
  UpdateMappingResponse,
  Dataset,
  ListDatasetsResponse,
  DeleteDatasetResponse,
  DatasetInsightsResponse,
} from "../types/api.types.js";
import type { DashboardFilters } from "../types/dashboard.types.js";

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
 * Extrae mensaje de error de la respuesta del backend.
 * Siempre devuelve un string, nunca un objeto, para evitar [object Object] en toasts.
 */
const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;

    if (data && typeof data === 'object') {
      // Estructura estándar: { error: "string" }
      if ('error' in data && typeof data.error === 'string' && data.error) {
        return data.error;
      }
      // Alternativa: { message: "string" }
      if ('message' in data && typeof data.message === 'string' && data.message) {
        return data.message;
      }
      // Zod/Express-validator: { errors: [...] }
      if ('errors' in data && Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        if (typeof first === 'string') return first;
        if (typeof first === 'object' && first !== null) {
          const f = first as Record<string, unknown>;
          return (typeof f.message === 'string' ? f.message : null)
            ?? (typeof f.msg === 'string' ? f.msg : null)
            ?? (() => {
              try {
                return JSON.stringify(first);
              } catch {
                return 'Error de validación';
              }
            })();
        }
      }
      // Fallback: serializar el objeto completo para debugging
      try { return JSON.stringify(data); } catch { /* ignore */ }
    }

    if (error.response?.statusText) return error.response.statusText;
    return error.message || 'Error desconocido';
  }

  return error instanceof Error ? error.message : 'Error desconocido';
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

export async function getDatasetInsights(
  datasetId: string,
  filters: DashboardFilters,
): Promise<DatasetInsightsResponse> {
  try {
    const response = await apiClient.get<DatasetInsightsResponse>(
      `/api/v1/datasets/${datasetId}/insights`,
      {
        params: {
          filters: JSON.stringify(filters),
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
 * Endpoint para configurar el mapping de columnas, KPIs y layout del dashboard.
 * Usado para completar la configuración después del upload de archivos.
 *
 * Después del PATCH exitoso, realiza un GET para obtener el dataset completo.
 *
 * @param datasetId - ID del dataset a actualizar
 * @param payload - Configuración de mapping completa
 * @returns Dataset actualizado completo
 * @throws Error si la actualización falla
 */
export async function updateDataset(
  datasetId: string,
  payload: UpdateMappingRequest,
): Promise<Dataset> {
  try {
    // Paso 1: Enviar la actualización de mapping
    await apiClient.patch<UpdateMappingResponse>(
      `/api/v1/datasets/${datasetId}`,
      payload,
    );

    // Paso 2: Obtener el dataset completo con un GET
    return await getDataset(datasetId);
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
