import axios, { type AxiosInstance } from "axios";
import type {
  AuthResponse,
  GoogleLoginRequest,
} from "@/features/auth/types/auth.types.js";

// ============================================================================
// AXIOS INSTANCE CON CONFIGURACIÓN BASE
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Helper function to safely get auth token from localStorage
const getValidAuthToken = (): string | null => {
  const storedAuth = localStorage.getItem("sideby-auth-storage");
  if (!storedAuth) {
    return null;
  }

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

    // Invalid structure: clear storage to prevent repeated errors
    localStorage.removeItem("sideby-auth-storage");
    return null;
  } catch {
    // Corrupted or non-parseable value: remove it and continue without token
    localStorage.removeItem("sideby-auth-storage");
    return null;
  }
};

// Interceptor to add token to requests (for future authenticated calls)
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = getValidAuthToken();
      if (token) {
        // Ensure headers exists before mutating
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Any unexpected error is logged but doesn't block the request
      // Using a simple approach since we don't have a frontend logger yet
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Failed to attach auth token to request:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================================
// AUTH REPOSITORY
// ============================================================================

export class AuthRepository {
  /**
   * Login con Google OAuth
   * @param googleToken - Token de Google obtenido del cliente
   * @returns Respuesta con user y JWT token
   */
  static async loginWithGoogle(googleToken: string): Promise<AuthResponse> {
    const payload: GoogleLoginRequest = { token: googleToken };

    const response = await apiClient.post<AuthResponse>(
      "/api/v1/auth/google",
      payload,
    );

    return response.data;
  }

  /**
   * Validar token JWT (futura implementación)
   */
  static async validateToken(): Promise<boolean> {
    try {
      // TODO: Implementar endpoint de validación
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Refresh token (futura implementación)
   */
  static async refreshToken(): Promise<AuthResponse | null> {
    try {
      // TODO: Implementar endpoint de refresh
      return null;
    } catch {
      return null;
    }
  }
}

export { apiClient };
