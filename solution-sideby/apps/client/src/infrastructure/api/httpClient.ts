/**
 * httpClient — Cliente HTTP compartido para todos los servicios de la aplicación.
 *
 * Centraliza:
 * - URL base (VITE_API_URL)
 * - Headers comunes (Content-Type)
 * - Timeout global
 * - Interceptor de autenticación JWT (Authorization header desde Zustand persist)
 *
 * Uso:
 * ```ts
 * import { httpClient } from "@/infrastructure/api/httpClient.js";
 * const response = await httpClient.get("/api/v1/users/me");
 * ```
 */

import axios, { type AxiosInstance } from "axios";
import { useAuthStore } from "@/features/auth/store/auth.store.js";

// ============================================================================
// TOKEN HELPER
// ============================================================================

/**
 * Lee el JWT del localStorage donde Zustand lo persiste.
 * Escoge el campo `state.token` del slice "sideby-auth-storage".
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

// ============================================================================
// INSTANCIA COMPARTIDA
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

httpClient.interceptors.request.use(
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

// ============================================================================
// INTERCEPTOR DE RESPUESTA — Manejo global de sesión expirada
// ============================================================================

/**
 * Si el backend responde 401, la sesión es inválida (token expirado o revocado).
 * Limpiamos el store de Zustand y redirigimos al login sin depender de React hooks.
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      globalThis.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
