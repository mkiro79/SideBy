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
  timeout: 10000, // 10 segundos
});

// Interceptor para agregar token en requests (para futuras llamadas autenticadas)
apiClient.interceptors.request.use(
  (config) => {
    const storedAuth = localStorage.getItem("sideby-auth-storage");
    if (storedAuth) {
      try {
        const { state } = JSON.parse(storedAuth);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error("Error parsing auth token:", error);
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
